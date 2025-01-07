import { getProjectDependencies, getProjectMismatches, queryProject } from '../utilities/project';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import {
  chooseDependencyPrompt,
  chooseVersionPrompt,
  confirmNextDependencyPrompt,
  enterVersionPrompt
} from '../prompts/dependency';
import { updateProjectDependency } from './updateProjectDependency';
import { getRecommendedVersion, sortVersions } from '../utilities/dependency';
import { IPackageJsonDependencyTable, JsonFile, JsonObject } from '@rushstack/node-core-library';
import {
  getRushSubspaceCommonVersionsFilePath,
  getSubspaceDependencies,
  loadRushSubspaceCommonVersions
} from '../utilities/subspace';
import { chooseSyncCommandPrompt } from '../prompts/project';
import { generateReport } from './generateReport';

const addVersionToCommonVersionConfiguration = (
  subspaceName: string,
  dependencyName: string,
  selectedVersion: string,
  rootPath: string
): void => {
  const subspaceCommonVersionsPath: string = getRushSubspaceCommonVersionsFilePath(subspaceName, rootPath);
  const subspaceCommonVersionsJson: RushSubspaceCommonVersionsJson = loadRushSubspaceCommonVersions(
    subspaceName,
    rootPath
  );

  Console.debug(
    `Adding ${Colorize.bold(selectedVersion)} to allowedAlternativeVersions of ${Colorize.bold(
      subspaceCommonVersionsPath
    )}`
  );

  if (subspaceCommonVersionsJson.allowedAlternativeVersions) {
    subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyName] = [
      ...(subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyName] || []),
      selectedVersion
    ];

    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath, {
      updateExistingFile: true
    });
  }
};

const syncDependencyVersion = async (
  dependencyToUpdate: string,
  projectToUpdate: string,
  rootPath: string
): Promise<boolean> => {
  const dependencyName: string = dependencyToUpdate.replace(' (cyclic)', '');
  const project: IRushConfigurationProjectJson | undefined = queryProject(projectToUpdate, rootPath);
  if (!project || !project.subspaceName) {
    return false;
  }

  const projectDependencies: IPackageJsonDependencyTable | undefined = getProjectDependencies(
    projectToUpdate,
    rootPath
  );
  const currentVersion: string | undefined = projectDependencies?.[dependencyName];
  if (!currentVersion) {
    Console.error(
      `Dependency ${Colorize.bold(dependencyName)} doesn't exist in the project ${Colorize.bold(
        projectToUpdate
      )}! Skipping...`
    );
    return false;
  }

  const subspaceCommonVersionsJson: JsonObject = loadRushSubspaceCommonVersions(
    project.subspaceName,
    rootPath
  );
  const subspaceAlternativeVersions: string[] =
    subspaceCommonVersionsJson.allowedAlternativeVersions[dependencyName] || [];

  const subspaceDependencies: Map<string, Map<string, string[]>> = getSubspaceDependencies(
    project.subspaceName,
    rootPath
  );

  const subspaceVersionsMap: Map<string, string[]> = subspaceDependencies.get(dependencyName) as Map<
    string,
    string[]
  >;

  const availableVersionsMap: Map<string, string[]> = new Map();

  // Add alternative versions
  for (const alternativeVersion of subspaceAlternativeVersions) {
    availableVersionsMap.set(alternativeVersion, []);
  }

  for (const [version, projects] of subspaceVersionsMap) {
    const newProjects: string[] = [...projects];
    const projectIndex: number = newProjects.indexOf(projectToUpdate);

    if (projectIndex > -1) {
      newProjects.splice(projectIndex, 1);
    }

    if (newProjects.length > 0) {
      availableVersionsMap.set(version, newProjects);
    }
  }

  const availableVersions: string[] = Array.from(availableVersionsMap.keys());

  const recommendedVersion: string | undefined = currentVersion
    ? getRecommendedVersion(currentVersion, availableVersions)
    : undefined;

  const versionToSync: string = await chooseVersionPrompt(
    availableVersionsMap,
    currentVersion,
    recommendedVersion
  );

  if (versionToSync === 'skip') {
    return false;
  } else if (versionToSync === 'manual') {
    const newVersion: string = (await enterVersionPrompt(dependencyName)).trim();
    addVersionToCommonVersionConfiguration(project.subspaceName, dependencyName, newVersion, rootPath);
    await updateProjectDependency(projectToUpdate, dependencyName, newVersion, rootPath);
  } else if (versionToSync === 'alternative') {
    addVersionToCommonVersionConfiguration(project.subspaceName, dependencyName, currentVersion, rootPath);
  } else {
    await updateProjectDependency(projectToUpdate, dependencyName, versionToSync, rootPath);
  }

  return true;
};

const fetchProjectMismatches = (projectName: string, rootPath: string): string[] => {
  const projectMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getProjectMismatches(projectName, rootPath);

  const mismatchedDependencies: string[] = Array.from(projectMismatches.keys());
  if (mismatchedDependencies.length === 0) {
    return [];
  }

  Console.warn(
    `There are ${Colorize.bold(
      `${mismatchedDependencies.length}`
    )} mismatched dependencies for the project ${Colorize.bold(projectName)}:\n${mismatchedDependencies
      .sort()
      .map(
        (mismatchedDependency) =>
          `- ${Colorize.bold(mismatchedDependency)}: ${sortVersions(
            Array.from(projectMismatches.get(mismatchedDependency)?.keys() || [])
          ).join(', ')}`
      )
      .join('\n')}\n`
  );

  return mismatchedDependencies;
};

export const syncProjectMismatchedDependencies = async (
  projectName: string,
  rootPath: string
): Promise<boolean> => {
  Console.title(`🔄 Syncing version mismatches for project ${Colorize.bold(projectName)}...`);

  let mismatchedDependencies: string[] = fetchProjectMismatches(projectName, rootPath);
  if (mismatchedDependencies.length === 0) {
    Console.success(`No mismatches found in the project ${Colorize.bold(projectName)}!`);
    return true;
  }

  const project: IRushConfigurationProjectJson | undefined = queryProject(projectName, rootPath);
  if (!project || !project.subspaceName) {
    Console.error(`Project ${Colorize.bold(projectName)} is not part of a subspace!`);
    return true;
  }

  const nextCommand: string = await chooseSyncCommandPrompt(project.packageName);
  switch (nextCommand) {
    case 'report':
      await generateReport(project.packageName, rootPath);
      break;
    case 'fix':
      do {
        const selectedDependency: string = await chooseDependencyPrompt(
          mismatchedDependencies,
          ` (${Colorize.bold(`${mismatchedDependencies.length}`)} mismatched dependencies)`
        );
        if (await syncDependencyVersion(selectedDependency, projectName, rootPath)) {
          mismatchedDependencies = fetchProjectMismatches(projectName, rootPath);
        }
      } while (
        mismatchedDependencies.length > 0 &&
        (await confirmNextDependencyPrompt(` (Current project: ${Colorize.bold(projectName)})`))
      );

      break;
    case 'skip':
      return false;
  }

  if (mismatchedDependencies.length === 0) {
    Console.success(
      `All mismatched dependencies for project ${Colorize.bold(
        projectName
      )} have been successfully synchronized!`
    );
  }

  return true;
};
