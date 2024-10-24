import { chooseSubspacePrompt } from './prompts/subspace';
import fs from 'fs';
import { IPackageJson, JsonFile, JsonObject } from '@rushstack/node-core-library';
import { VersionMismatchFinder } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinder';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { enterVersionPrompt, requestVersionTypePrompt } from './prompts/version';
import Console from './providers/console';
import chalk from 'chalk';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { queryProject } from './utilities/project';
import { RushConfiguration } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { Subspace } from '@rushstack/rush-sdk/lib/api/Subspace';
import { querySubspaces } from './utilities/repository';
import { getRootPath } from './utilities/path';
import { RushPathConstants } from './constants/paths';
import { RushConstants } from '@rushstack/rush-sdk';

export async function syncVersions(): Promise<void> {
  Console.debug('Executing project version synchronization command...');

  const rushConfig: RushConfiguration = RushConfiguration.loadFromDefaultLocation();

  const sourceSubspaces: string[] = querySubspaces();
  if (sourceSubspaces.length === 0) {
    Console.error(`No subspaces found in the monorepo ${chalk.bold(getRootPath())}! Exiting...`);
    return;
  }

  const selectedSubspaceName: string = await chooseSubspacePrompt(sourceSubspaces);
  const selectedSubspace: Subspace = rushConfig.getSubspace(selectedSubspaceName);

  const { mismatches } = VersionMismatchFinder.getMismatches(rushConfig, {
    variant: undefined,
    subspace: selectedSubspace
  });

  if (mismatches.size === 0) {
    Console.success(`No mismatches found in the subspace ${chalk.bold(selectedSubspaceName)}! Exiting...`);
    return;
  }

  let count: number = 0;
  const subspaceCommonVersionsPath: string = `${getRootPath()}/${
    RushPathConstants.SubspacesConfigurationFolderPath
  }/${selectedSubspaceName}/${RushConstants.commonVersionsFilename}`;
  const subspaceCommonVersionsJson: JsonObject = JsonFile.load(subspaceCommonVersionsPath);

  for (const [dependencyName, mismatchVersionMap] of mismatches.entries()) {
    count++;

    const availableVersions: string[] = Array.from(mismatchVersionMap.keys());
    let selectedVersion: string | undefined;
    Console.title(
      `🔄 Syncing package ${chalk.bold(count)} of ${chalk.bold(mismatches.size + 1)} version mismatches...`
    );
    Console.warn(`Syncing the dependency ${chalk.bold(dependencyName)}`);

    if (mismatchVersionMap.size > 0) {
      Console.warn(
        `There are ${chalk.bold(mismatchVersionMap.size)} different versions of the ${chalk.bold(
          dependencyName
        )}`
      );
    }

    const versionToSync: string = await requestVersionTypePrompt(availableVersions, mismatchVersionMap);
    if (versionToSync === 'skip') {
      continue;
    } else if (versionToSync === 'manual') {
      const newVersion: string = await enterVersionPrompt(dependencyName);
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
        const project: IRushConfigurationProjectJson | undefined = queryProject(packageNameToUpdate);
        if (!project) {
          Console.error(`Could not load find the package ${chalk.bold(packageNameToUpdate)}. Skipping...`);
          continue;
        }

        const pkgJsonPath: string = `${project.projectFolder}/package.json`;
        if (!fs.existsSync(pkgJsonPath)) {
          Console.error(`Could not load ${chalk.bold(pkgJsonPath)}. Skipping...`);
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
      updateExistingFile: true
    });
  }

  Console.success('Version sync complete! Please test and validate all affected packages.');
}
