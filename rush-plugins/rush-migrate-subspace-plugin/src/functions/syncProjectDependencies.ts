import { getProjectDependencies, getProjectMismatches, queryProject } from '../utilities/project';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { chooseDependencyPrompt, chooseVersionPrompt, enterVersionPrompt } from '../prompts/dependency';
import { updateProjectDependency } from './updateProjectDependency';
import { getRecommendedVersion } from '../utilities/dependency';
import { IPackageJsonDependencyTable, JsonFile, JsonObject } from '@rushstack/node-core-library';
import { getRushSubspaceConfigurationFolderPath, getSubspaceDependencies } from '../utilities/subspace';
import { updateSubspaceAlternativeVersions } from './updateSubspace';
import { RushConstants } from '@rushstack/rush-sdk';
import { confirmProjectSyncVersions } from '../prompts/project';

const addVersionToCommonVersionConfiguration = (
  subspaceName: string,
  dependencyName: string,
  selectedVersion: string
): void => {
  const subspaceCommonVersionsPath: string = `${getRushSubspaceConfigurationFolderPath(subspaceName)}/${
    RushConstants.commonVersionsFilename
  }`;
  const subspaceCommonVersionsJson: JsonObject = JsonFile.load(subspaceCommonVersionsPath);

  Console.debug(
    `Adding ${Colorize.bold(selectedVersion)} to allowedAlternativeVersions of ${Colorize.bold(
      subspaceCommonVersionsPath
    )}`
  );

  subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyName] = updateSubspaceAlternativeVersions(
    subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyName],
    [selectedVersion]
  );

  JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath, {
    updateExistingFile: true
  });
};

const syncDependencyVersion = async (dependencyToUpdate: string, projectToUpdate: string): Promise<void> => {
  const project: IRushConfigurationProjectJson | undefined = queryProject(projectToUpdate);
  if (!project || !project.subspaceName) {
    return;
  }

  const subspaceDependencies: Map<string, Map<string, string[]>> = getSubspaceDependencies(
    project.subspaceName
  );
  const availableVersionsMap: Map<string, string[]> = subspaceDependencies.get(dependencyToUpdate) as Map<
    string,
    string[]
  >;
  const availableVersions: string[] = Array.from(availableVersionsMap.keys());
  const projectDependencies: IPackageJsonDependencyTable | undefined =
    getProjectDependencies(projectToUpdate);
  const currentVersion: string | undefined = projectDependencies?.[dependencyToUpdate];
  if (!currentVersion) {
    Console.error(
      `Dependency ${Colorize.bold(dependencyToUpdate)} doesn't exist in the project ${Colorize.bold(
        projectToUpdate
      )}! Skipping...`
    );
    return;
  }

  const recommendedVersion: string | undefined = currentVersion
    ? getRecommendedVersion(currentVersion, availableVersions)
    : undefined;

  const versionToSync: string = await chooseVersionPrompt(
    availableVersionsMap,
    currentVersion,
    recommendedVersion
  );

  if (versionToSync === 'skip') {
    return;
  } else if (versionToSync === 'manual') {
    const newVersion: string = (await enterVersionPrompt(dependencyToUpdate)).trim();
    addVersionToCommonVersionConfiguration(project.subspaceName, dependencyToUpdate, newVersion);
    await updateProjectDependency(projectToUpdate, dependencyToUpdate, newVersion);
  } else if (versionToSync === 'alternative') {
    addVersionToCommonVersionConfiguration(project.subspaceName, dependencyToUpdate, currentVersion);
  } else {
    await updateProjectDependency(projectToUpdate, dependencyToUpdate, versionToSync);
  }
};

export const syncProjectDependencies = async (
  dependencies: string[],
  projectName: string
): Promise<boolean> => {
  const dependenciesToSync: string[] = [...dependencies];
  do {
    const selectedDependency: string = await chooseDependencyPrompt(dependenciesToSync);
    await syncDependencyVersion(selectedDependency, projectName);
    dependenciesToSync.splice(dependenciesToSync.indexOf(selectedDependency), 1);
  } while (dependenciesToSync.length > 0);

  return dependenciesToSync.length === 0;
};

export const syncProjectMismatchedDependencies = async (
  projectName: string,
  forceSync: boolean = false
): Promise<boolean> => {
  Console.title(`🔄 Syncing version mismatches for project ${Colorize.bold(projectName)}...`);

  const projectMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getProjectMismatches(projectName);

  const mismatchedDependencies: string[] = Array.from(projectMismatches.keys());

  if (mismatchedDependencies.length === 0) {
    Console.success(`No mismatches found in the project ${Colorize.bold(projectName)}!`);
    return true;
  }

  Console.warn(
    `There are ${Colorize.bold(
      `${mismatchedDependencies.length}`
    )} mismatched dependencies for the project ${Colorize.bold(projectName)}...`
  );

  const confirmSync: boolean = forceSync || (await confirmProjectSyncVersions());
  if (!confirmSync) {
    return true;
  }

  const project: IRushConfigurationProjectJson | undefined = queryProject(projectName);
  if (!project || !project.subspaceName) {
    Console.error(`Project ${Colorize.bold(projectName)} is not part of a subspace!`);
    return false;
  }

  if (await syncProjectDependencies(mismatchedDependencies, project.packageName)) {
    Console.success(
      `All mismatched dependencies for the subspace ${Colorize.bold(projectName)} have been synced!`
    );
    return true;
  }

  return false;
};
