import { INodePackageJson, JsonFile, JsonObject } from '@rushstack/node-core-library';
import { enterReportFileLocationPrompt, confirmSaveReportPrompt } from './prompts/report';
import { chooseSubspacePrompt } from './prompts/subspace';
import { chooseProjectPrompt } from './prompts/project';
import Console from './providers/console';
import { loadRushConfiguration, loadRushSubspacesConfiguration } from './utilities/repository';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import chalk from 'chalk';
import { getRootPath } from './utilities/path';
import { RushNameConstants } from './constants/paths';
import path from 'path';

export const generateReport = async (): Promise<void> => {
  Console.debug('Executing project reporting command...');

  const rushConfig: IRushConfigurationJson = loadRushConfiguration();
  const subspacesConfig: ISubspacesConfigurationJson = loadRushSubspacesConfiguration();
  const selectedSubspaceName: string = await chooseSubspacePrompt(subspacesConfig.subspaceNames);

  const subspaceProjects: IRushConfigurationProjectJson[] = rushConfig.projects.filter(
    ({ subspaceName }) => subspaceName === selectedSubspaceName
  );

  if (subspaceProjects.length === 0) {
    Console.error(`No projects found in the monorepo ${chalk.bold(getRootPath())}! Exiting...`);
    return;
  }

  const projectToReport: IRushConfigurationProjectJson = await chooseProjectPrompt(subspaceProjects);
  const projectToReportIndex: number = subspaceProjects.findIndex(
    ({ packageName }) => packageName === projectToReport.packageName
  );

  if (projectToReportIndex < 0) {
    Console.error(`We couldn't find ${chalk.bold(projectToReport.packageName)}! Please try again.`);
    return;
  }

  const [subspaceProject] = subspaceProjects.splice(projectToReportIndex, 1);

  Console.debug(
    `Generating report for all the version mismatches between the projects ${subspaceProjects
      .map(({ packageName }) => chalk.bold(packageName))
      .join(',')} and the project ${chalk.bold(projectToReport.packageName)}...`
  );

  // Create a map of dependencies
  const subspaceDependencies: Map<string, Set<string>> = new Map();
  for (const subspaceProject of subspaceProjects) {
    const packageJson: INodePackageJson = JsonFile.load(`${subspaceProject.projectFolder}/package.json`);
    if (packageJson.dependencies) {
      for (const [dep, version] of Object.entries(packageJson.dependencies)) {
        if (subspaceDependencies.has(dep)) {
          subspaceDependencies.get(dep)?.add(version);
        } else {
          subspaceDependencies.set(dep, new Set([version]));
        }
      }
    }

    if (packageJson.devDependencies) {
      for (const [dep, version] of Object.entries(packageJson.devDependencies)) {
        if (subspaceDependencies.has(dep)) {
          subspaceDependencies.get(dep)?.add(version);
        } else {
          subspaceDependencies.set(dep, new Set([version]));
        }
      }
    }
  }

  // Check the package dependencies against the subspace dependencies to look for collisions
  const migratePackageConflicts: Record<string, Set<string>> = {};

  const packageJson: INodePackageJson = JsonFile.load(`${subspaceProject.projectFolder}/package.json`);
  if (packageJson.dependencies) {
    for (const [dep, version] of Object.entries(packageJson.dependencies)) {
      if (subspaceDependencies.has(dep)) {
        const subspaceDepVersions: Set<string> | undefined = subspaceDependencies.get(dep);
        if (!subspaceDepVersions?.has(version)) {
          // Collision version
          if (migratePackageConflicts[dep]) {
            migratePackageConflicts[dep].add(version as string);
          } else {
            migratePackageConflicts[dep] = new Set([version as string]);
          }
          subspaceDependencies
            .get(dep)
            ?.forEach(migratePackageConflicts[dep].add, migratePackageConflicts[dep]);
        }
      }
    }

    for (const [dep, version] of Object.entries(packageJson.devDependencies || {})) {
      if (subspaceDependencies.has(dep)) {
        const subspaceDepVersions: Set<string> | undefined = subspaceDependencies.get(dep);
        if (!subspaceDepVersions?.has(version)) {
          // Collision version
          if (migratePackageConflicts[dep]) {
            migratePackageConflicts[dep].add(version as string);
          } else {
            migratePackageConflicts[dep] = new Set([version as string]);
          }
          subspaceDependencies
            .get(dep)
            ?.forEach(migratePackageConflicts[dep].add, migratePackageConflicts[dep]);
        }
      }
    }
  }

  const outputJSONFile: JsonObject = {
    conflictingVersions: {}
  };

  for (const [conflictPackage, conflictVersions] of Object.entries(migratePackageConflicts)) {
    const conflictVersionsArray: string[] = Array.from(conflictVersions);
    Console.warn(
      `${chalk.bold(conflictPackage)} has conflicting versions: ${chalk.bold(
        conflictVersionsArray.join(',')
      )}`
    );
    outputJSONFile.conflictingVersions[conflictPackage] = conflictVersionsArray;
  }

  const saveToFile: boolean = await confirmSaveReportPrompt();
  if (saveToFile) {
    const reportFilePath: string = `${path.basename(projectToReport.projectFolder)}_${
      RushNameConstants.AnalysisFileName
    }`;

    const jsonFilePath: string = await enterReportFileLocationPrompt(reportFilePath);
    JsonFile.save(outputJSONFile, jsonFilePath, { prettyFormatting: true });
    Console.success(`Saved report file to ${chalk.bold(jsonFilePath)}.\n`);
  }
};
