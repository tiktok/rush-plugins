import { INodePackageJson, JsonFile } from '@rushstack/node-core-library';
import chalk from 'chalk';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { RushPathConstants } from '../constants/paths';
import { confirmSaveReport, enterReportFileLocation } from '../commands/report';

export const generateReport = async (subspaceName: string): Promise<void> => {
  const rushJson: IRushConfigurationJson = JsonFile.load(RushPathConstants.RushConfigurationJson);

  // Get all the projects for this subspace
  const subspaceProjects: IRushConfigurationProjectJson[] = [];
  for (const project of rushJson.projects) {
    if (project.subspaceName === subspaceName) {
      subspaceProjects.push(project);
    }
  }

  console.log(
    'Generating report for subspace projects: ',
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
  for (const subspaceProject of subspaceProjects) {
    const packageJson: INodePackageJson = JsonFile.load(`${subspaceProject?.projectFolder}/package.json`);
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
  }

  const outputJSONFile: any = {
    conflictingVersions: {}
  };

  for (const [conflictPackage, conflictVersions] of Object.entries(migratePackageConflicts)) {
    console.log(chalk.red(`${conflictPackage} has conflicting versions: ${Array.from(conflictVersions)}`));
    outputJSONFile.conflictingVersions[conflictPackage] = Array.from(conflictVersions);
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
