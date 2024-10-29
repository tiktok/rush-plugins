import { INodePackageJson, JsonFile, JsonObject } from '@rushstack/node-core-library';
import { enterReportFileLocationPrompt, confirmSaveReportPrompt } from './prompts/report';
import { chooseSubspacePrompt } from './prompts/subspace';
import { chooseProjectPrompt } from './prompts/project';
import Console from './providers/console';
import { loadRushConfiguration, loadRushSubspacesConfiguration } from './utilities/repository';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { Colorize } from '@rushstack/terminal';
import { getRootPath } from './utilities/path';
import { RushNameConstants } from './constants/paths';
import path from 'path';

export const generateReport = async (): Promise<void> => {
  Console.debug('Executing project analyze command...');

  const rushConfig: IRushConfigurationJson = loadRushConfiguration();
  const subspacesConfig: ISubspacesConfigurationJson = loadRushSubspacesConfiguration();

  if (subspacesConfig.subspaceNames.length === 0) {
    Console.error(`No subspaces found in the monorepo ${Colorize.bold(getRootPath())}! Exiting...`);
    return;
  }

  const selectedSubspaceName: string = await chooseSubspacePrompt(subspacesConfig.subspaceNames);

  const subspaceProjects: IRushConfigurationProjectJson[] = rushConfig.projects.filter(
    ({ subspaceName }) => subspaceName === selectedSubspaceName
  );

  if (subspaceProjects.length === 0) {
    Console.error(`No projects found in the monorepo ${Colorize.bold(getRootPath())}! Exiting...`);
    return;
  }

  const selectedProject: IRushConfigurationProjectJson = await chooseProjectPrompt(subspaceProjects);
  const selectedProjectIndex: number = subspaceProjects.findIndex(
    ({ packageName }) => packageName === selectedProject.packageName
  );

  if (selectedProjectIndex < 0) {
    Console.error(`We couldn't find ${Colorize.bold(selectedProject.packageName)}! Please try again.`);
    return;
  }

  const [subspaceProject] = subspaceProjects.splice(selectedProjectIndex, 1);

  Console.debug(
    `Generating report for all the version mismatches between the projects ${subspaceProjects
      .map(({ packageName }) => Colorize.bold(packageName))
      .join(',')} and the project ${Colorize.bold(selectedProject.packageName)}...`
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

  const conflictedPackages: string[] = Object.keys(migratePackageConflicts);
  if (conflictedPackages.length === 0) {
    Console.success(
      `No conflicted packages found in the subspace ${Colorize.bold(
        selectedSubspaceName
      )} from ${Colorize.bold(selectedProject.packageName)}! Exiting...`
    );
    return;
  }

  for (const conflictPackage of conflictedPackages) {
    const conflictVersions: string[] = Array.from(migratePackageConflicts[conflictPackage]);
    Console.warn(
      `${Colorize.bold(conflictPackage)} has conflicting versions: ${Colorize.bold(
        conflictVersions.join(',')
      )}`
    );
    outputJSONFile.conflictingVersions[conflictPackage] = conflictVersions;
  }

  const saveToFile: boolean = await confirmSaveReportPrompt();
  if (saveToFile) {
    const reportFilePath: string = `${path.basename(selectedProject.projectFolder)}_${
      RushNameConstants.AnalysisFileName
    }`;

    const jsonFilePath: string = await enterReportFileLocationPrompt(reportFilePath);
    JsonFile.save(outputJSONFile, jsonFilePath, { prettyFormatting: true });
    Console.success(`Saved report file to ${Colorize.bold(jsonFilePath)}.`);
  }
};
