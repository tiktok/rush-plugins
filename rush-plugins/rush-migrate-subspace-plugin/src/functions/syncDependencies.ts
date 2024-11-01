import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { RushConstants } from '@rushstack/rush-sdk';
import { JsonFile, JsonObject } from '@rushstack/node-core-library';
import { chooseDependencyPrompt, enterVersionPrompt, requestVersionTypePrompt } from '../prompts/dependency';
import { Colorize } from '@rushstack/terminal';
import Console from '../providers/console';
import { updateProjectDependency } from './updateProjectDependency';
import { getRushSubspaceConfigurationFolderPath } from '../utilities/subspace';
import { updateSubspaceAlternativeVersions } from './updateSubspace';

const syncDependencyVersion = async (
  dependencyToUpdate: string,
  mismatches: ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>,
  subspaceName: string,
  projectToUpdate?: string
): Promise<void> => {
  const mismatchedVersions: string[] = Array.from(mismatches.keys());
  const currentVersion: string | undefined = mismatchedVersions.find((version) => {
    return mismatches.get(version)?.find(({ friendlyName }) => friendlyName === projectToUpdate);
  });

  if (!currentVersion) {
    Console.error(`No version found for ${Colorize.bold(dependencyToUpdate)}! Skipping...`);
    return;
  }

  const subspaceCommonVersionsPath: string = `${getRushSubspaceConfigurationFolderPath(subspaceName)}/${
    RushConstants.commonVersionsFilename
  }`;
  const subspaceCommonVersionsJson: JsonObject = JsonFile.load(subspaceCommonVersionsPath);

  let selectedVersion: string | undefined;
  const commonVersions: string[] =
    subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyToUpdate] || [];

  const availableVersions: { name: string; value: string }[] = [];

  for (const mismatchedVersion of mismatchedVersions) {
    const mismatchEntities: readonly VersionMismatchFinderEntity[] = mismatches.get(mismatchedVersion) || [];
    availableVersions.push({
      name: `${mismatchedVersion} - used by ${mismatchEntities
        ?.map(({ friendlyName }) => friendlyName)
        .join(', ')}}`,
      value: mismatchedVersion
    });
  }

  for (const commonVersion of commonVersions) {
    if (!availableVersions.find(({ value }) => value === commonVersion)) {
      availableVersions.push({
        name: `${commonVersion} - in allowedAlternativeVersions`,
        value: commonVersion
      });
    }
  }

  const versionToSync: string = await requestVersionTypePrompt(availableVersions);
  if (versionToSync === 'skip') {
    return;
  } else if (versionToSync === 'manual') {
    const newVersion: string = await enterVersionPrompt(dependencyToUpdate);
    selectedVersion = newVersion.trim();
  } else if (versionToSync === 'alternative') {
    subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyToUpdate] =
      updateSubspaceAlternativeVersions(
        subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyToUpdate],
        [currentVersion]
      );

    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath, {
      updateExistingFile: true
    });

    return;
  } else {
    selectedVersion = versionToSync;
  }

  const allProjects: string[] = [];
  if (projectToUpdate) {
    allProjects.push(projectToUpdate);
  } else {
    // Only update package.json if we don't use alternative
    for (const version of mismatchedVersions) {
      if (version !== selectedVersion) {
        const packagesWithVersion: readonly VersionMismatchFinderEntity[] = mismatches.get(version) || [];
        allProjects.push(...packagesWithVersion.map(({ friendlyName }) => friendlyName));
      }
    }
  }

  for (const projectToUpdate of allProjects) {
    await updateProjectDependency(projectToUpdate, dependencyToUpdate, selectedVersion);
  }

  return;
};

export const syncDependencies = async (
  mismatches: ReadonlyMap<string, ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>>,
  subspaceName: string,
  projectName?: string
): Promise<boolean> => {
  const missingMismatchedDependencies: string[] = Array.from(mismatches.keys());
  do {
    const selectedDependency: string = await chooseDependencyPrompt(missingMismatchedDependencies);
    const selectedDependencyMismatches: ReadonlyMap<string, readonly VersionMismatchFinderEntity[]> =
      mismatches.get(selectedDependency) as ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>;

    Console.warn(
      `There are ${Colorize.bold(
        `${selectedDependencyMismatches.size}`
      )} mismatches for the dependency ${Colorize.bold(selectedDependency)}...`
    );

    await syncDependencyVersion(selectedDependency, selectedDependencyMismatches, subspaceName, projectName);
    missingMismatchedDependencies.splice(missingMismatchedDependencies.indexOf(selectedDependency), 1);
  } while (missingMismatchedDependencies.length > 0);

  return missingMismatchedDependencies.length === 0;
};
