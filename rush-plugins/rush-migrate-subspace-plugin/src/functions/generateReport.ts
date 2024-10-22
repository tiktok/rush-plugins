import { INodePackageJson, JsonFile } from '@rushstack/node-core-library';
import chalk from 'chalk';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { enterReportFileLocation, confirmSaveReport } from '../commands/report';
import { chooseSubspace } from '../commands/subspace';
import { chooseProject } from '../commands/project';
import { queryProjects } from '../utilities/project';

export const generateReport = async (): Promise<void> => {
  const subspaceName: string = await chooseSubspace();

  const subspaceProjects: IRushConfigurationProjectJson[] = queryProjects().filter(
    (project) => project.subspaceName === subspaceName
  );

  const projectName: string = await chooseProject(subspaceProjects);
  const projectIndex: number = subspaceProjects.findIndex((p) => p.packageName === projectName);

  if (projectIndex < 0) {
    console.log(chalk.red(`We couldn't find "${projectName}". Please try again.`));
    return;
  }

  const [project] = subspaceProjects.splice(projectIndex, 1);

  console.log(
    `Generating report for all the version mismatches between [${subspaceProjects.map(
      (project) => `"${chalk.green(project.packageName)}"`
    )}] and the project "${chalk.green(projectName)}"...`
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

  const packageJson: INodePackageJson = JsonFile.load(`${project.projectFolder}/package.json`);
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

  const outputJSONFile: any = {
    conflictingVersions: {}
  };

  for (const [conflictPackage, conflictVersions] of Object.entries(migratePackageConflicts)) {
    const conflictVersionsArray: string[] = Array.from(conflictVersions);
    console.log(chalk.red(`${conflictPackage} has conflicting versions: ${conflictVersionsArray}`));
    outputJSONFile.conflictingVersions[conflictPackage] = conflictVersionsArray;
  }

  const saveToFile: boolean = await confirmSaveReport();
  if (saveToFile) {
    let jsonFilePath: string = '';
    const filePath: string = await enterReportFileLocation();
    jsonFilePath = filePath;

    // Get the file path, save the file
    JsonFile.save(outputJSONFile, jsonFilePath);
    console.log(chalk.green(`Saved analysis file to ${jsonFilePath}.`));
  }
};
