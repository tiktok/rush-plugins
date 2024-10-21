/**
 * This function receives a project and a subspace, and returns a simple report of the changes that will need to be made to migrate
 * this project into the subspace.
 */

import { INodePackageJson, JsonFile } from '@rushstack/node-core-library';
import inquirer from 'inquirer';
import { getRootPath } from '../utilities/getRootPath';
import chalk from 'chalk';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';

export const generateProjectReport = async (projectName: string, subspaceName: string): Promise<void> => {
  const rushJson: IRushConfigurationJson = JsonFile.load(`${getRootPath()}/rush.json`);

  // Get all the projects for this subspace
  let currProject: IRushConfigurationProjectJson | undefined;
  const subspaceProjects: IRushConfigurationProjectJson[] = [];
  for (const project of rushJson.projects) {
    if (project.packageName === projectName) {
      currProject = project;
    } else if (project.subspaceName === subspaceName) {
      subspaceProjects.push(project);
    }
  }

  console.log(
    'subspace projects: ',
    subspaceProjects.map((p) => p.packageName)
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
  const migratePackageJSON: INodePackageJson = JsonFile.load(`${currProject?.projectFolder}/package.json`);
  if (migratePackageJSON.dependencies) {
    for (const [dep, version] of Object.entries(migratePackageJSON.dependencies)) {
      if (subspaceDependencies.has(dep)) {
        const subspaceDepVersions: Set<string> | undefined = subspaceDependencies.get(dep);
        if (!subspaceDepVersions?.has(version)) {
          // Collison version
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
    for (const [dep, version] of Object.entries(migratePackageJSON.devDependencies || {})) {
      if (subspaceDependencies.has(dep)) {
        const subspaceDepVersions: Set<string> | undefined = subspaceDependencies.get(dep);
        if (!subspaceDepVersions?.has(version)) {
          // Collison version
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
    console.log(chalk.red(`${conflictPackage} has conflicting versions: ${Array.from(conflictVersions)}`));
    outputJSONFile.conflictingVersions[conflictPackage] = Array.from(conflictVersions);
  }
  const { saveToFile } = await inquirer.prompt([
    {
      message: 'Do you want to output the results to a JSON file?',
      type: 'confirm',
      name: 'saveToFile'
    }
  ]);

  if (saveToFile) {
    let jsonFilePath: string = '';
    const { filePath } = await inquirer.prompt([
      {
        message: `Please enter the file path to save this file. Please do not commit it to git.`,
        type: 'input',
        name: 'filePath',
        default: `${getRootPath()}/analysis.json`
      }
    ]);
    jsonFilePath = filePath;
    // Get the file path, save the file
    JsonFile.save(outputJSONFile, jsonFilePath);
    console.log(chalk.green(`Saved analysis file to ${jsonFilePath}.`));
  }
};
