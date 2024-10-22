import { chooseSubspace } from '../commands/subspace';

import chalk from 'chalk';
import fs from 'fs';
import { IPackageJson, JsonFile } from '@rushstack/node-core-library';
import { VersionMismatchFinder } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinder';
import { ICommonVersionsJsonVersionsMap } from '@rushstack/rush-sdk/lib/api/CommonVersionsConfiguration';
import { Subspace } from '@rushstack/rush-sdk/lib/api/Subspace';
import { RushConfiguration } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { RushConfigurationProject } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { enterVersion, requestVersionType } from '../commands/version';
import { RushPathConstants } from '../constants/paths';

export async function syncVersions(): Promise<void> {
  const config: RushConfiguration = RushConfiguration.loadFromDefaultLocation();
  const subspaceName: string = await chooseSubspace();

  const selectedSubspace: Subspace = config.subspaces.filter(
    (subspace) => subspace.subspaceName === subspaceName
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
  const subspaceCommonVersionsPath: string = `${RushPathConstants.SubspacesConfigurationFolder}/${subspaceName}/common-versions.json`;
  const subspaceCommonVersionsJson: ICommonVersionsJsonVersionsMap =
    JsonFile.load(subspaceCommonVersionsPath);
  for (const [dependencyName, mismatchVersionMap] of mismatches.entries()) {
    count++;

    const availableVersions: string[] = Array.from(mismatchVersionMap.keys());
    let selectedVersion: string | undefined;
    console.log(`Syncing package ${count} of ${mismatches.size + 1} version mismatches. \n`);
    console.log(chalk.green(`Syncing dependency: ${dependencyName}`));
    console.log(
      `There are ${mismatchVersionMap.size} different versions of the ${dependencyName} dependency: \n`
    );
    const versionToSync: string = await requestVersionType(availableVersions, mismatchVersionMap);
    if (versionToSync === 'skip') {
      continue;
    } else if (versionToSync === 'manual') {
      const newVersion: string = await enterVersion(dependencyName);
      selectedVersion = newVersion.trim();
    } else if (versionToSync === 'alternative') {
      subspaceCommonVersionsJson.allowedAlternativeVersions = {
        ...subspaceCommonVersionsJson.allowedAlternativeVersions,
        [dependencyName]: availableVersions
      };
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

    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath, {
      updateExistingFile: true,
      prettyFormatting: true
    });
    console.clear();
  }

  console.log(chalk.green('Version sync complete! Please test and validate all affected packages.'));
}
