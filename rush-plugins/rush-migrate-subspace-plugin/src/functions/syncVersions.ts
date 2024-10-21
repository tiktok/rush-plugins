import { querySubspace } from './querySubspace';

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import { IPackageJson, JsonFile } from '@rushstack/node-core-library';
import { VersionMismatchFinder } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinder';
import {
  CommonVersionsConfiguration,
  RushConfiguration,
  RushConfigurationProject,
  Subspace
} from '@rushstack/rush-sdk/lib';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';

export async function syncVersions(): Promise<void> {
  const config: RushConfiguration = RushConfiguration.loadFromDefaultLocation();

  const subspaceName: string = await querySubspace();
  const selectedSubspace: Subspace = config.subspaces.filter(
    (subspace: any) => subspace.subspaceName === subspaceName
  )[0];

  const { mismatches } = VersionMismatchFinder.getMismatches(config, {
    variant: undefined,
    subspace: selectedSubspace
  });

  if (mismatches.size === 0) {
    console.log(chalk.green('No mismatches found!'));
    return;
  }

  console.clear();

  let count: number = 0;
  const subspaceCommonVersionsPath: string = `${selectedSubspace.getSubspaceConfigFolderPath()}/common-versions.json`;
  const subspaceCommonVersionsJson: CommonVersionsConfiguration = JsonFile.load(subspaceCommonVersionsPath);
  const allowedAlternativeVersions: Map<string, readonly string[]> =
    subspaceCommonVersionsJson.allowedAlternativeVersions;
  for (const [dependencyName, mismatchVersionMap] of mismatches.entries()) {
    count++;

    const availableVersions: string[] = Array.from(mismatchVersionMap.keys());
    let selectedVersion: string | undefined;
    console.log(`Syncing package ${count} of ${mismatches.size + 1} version mismatches. \n`);
    console.log(chalk.green(`Syncing dependency: ${dependencyName}`));
    console.log(
      `There are ${mismatchVersionMap.size} different versions of the ${dependencyName} dependency: \n`
    );
    const { versionToSync } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionToSync',
        message: 'Which version would you like to sync all the packages to?',
        choices: [
          ...availableVersions.map((ver) => {
            const packagesWithVersion: readonly VersionMismatchFinderEntity[] =
              mismatchVersionMap.get(ver) || [];
            return {
              value: ver,
              name: `${ver} - used by ${packagesWithVersion.length} packages.`
            };
          }),
          { name: 'Manual Entry', value: 'manual' },
          { name: 'Skip this package', value: 'skip' },
          { name: 'Add versions to allowedAlternativeVersions', value: 'alternative' }
        ]
      }
    ]);

    if (versionToSync === 'skip') {
      continue;
    } else if (versionToSync === 'manual') {
      const { newVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newVersion',
          message: `Please enter the version you wish to set for the ${dependencyName} package.`
        }
      ]);
      selectedVersion = newVersion.trim();
    } else if (versionToSync === 'alternative') {
      allowedAlternativeVersions.set(dependencyName, availableVersions);
    } else {
      selectedVersion = versionToSync;
    }

    if (selectedVersion) {
      // Only update package.json if we don't use alternative
      const allPackageNamesToUpdate: string[] = [];
      for (const version of availableVersions) {
        if (version !== selectedVersion) {
          const packagesWithVersion: readonly VersionMismatchFinderEntity[] =
            mismatchVersionMap.get(version) || [];
          allPackageNamesToUpdate.push(...packagesWithVersion.map(({ friendlyName }) => friendlyName));
        }
      }
      for (const packageNameToUpdate of allPackageNamesToUpdate) {
        const projectConfig: RushConfigurationProject | undefined =
          config.getProjectByName(packageNameToUpdate);
        if (!projectConfig) {
          console.log(chalk.red(`Could not load find the package: ${packageNameToUpdate}, skipping...`));
          continue;
        }

        const pkgJsonPath: string = `${projectConfig.projectFolder}/package.json`;
        if (!fs.existsSync(pkgJsonPath)) {
          console.log(
            chalk.red(
              `Could not load package.json file for package: ${projectConfig.packageName}, skipping...`
            )
          );
          continue;
        }

        const packageJson: IPackageJson = JsonFile.load(pkgJsonPath);
        if (packageJson?.dependencies && packageJson.dependencies[dependencyName]) {
          packageJson.dependencies[dependencyName] = selectedVersion;
        } else if (packageJson?.devDependencies && packageJson.devDependencies[dependencyName]) {
          packageJson.devDependencies[dependencyName] = selectedVersion;
        }
        JsonFile.save(packageJson, pkgJsonPath, { updateExistingFile: true });
      }
    }

    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath, { updateExistingFile: true });
    console.clear();
  }

  console.log(chalk.green('Version sync complete! Please test and validate all affected packages.'));
}
