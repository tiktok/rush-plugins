import {
  chooseSubspacePrompt,
  scanForUnusedDependencyVersionsPrompt,
  scanForDuplicatedDependenciesPrompt,
  scanForSupersetDependencyVersionsPrompt,
  scanForAllDependenciesPrompt
} from './prompts/subspace';
import Console from './providers/console';
import { getRootPath } from './utilities/path';
import { Colorize } from '@rushstack/terminal';
import {
  getRushSubspaceCommonVersionsFilePath,
  getSubspaceDependencies,
  isSubspaceSupported,
  loadRushSubspaceCommonVersions,
  queryProjectsFromSubspace
} from './utilities/subspace';
import { getRushSubspacesConfigurationJsonPath, querySubspaces } from './utilities/repository';
import { RushConstants } from '@rushstack/rush-sdk';
import { chooseDependencyPrompt, confirmNextDependencyPrompt } from './prompts/dependency';
import { IPackageJson, JsonFile } from '@rushstack/node-core-library';
import { rSortVersions, subsetVersion } from './utilities/dependency';
import {
  getProjectPackageFilePath,
  loadProjectPackageJson,
  updateProjectDependency
} from './utilities/project';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { RESERVED_VERSIONS } from './constants/versions';

const removeSupersetDependency = async (
  subspaceName: string,
  dependencyName: string,
  versionsMap: Map<string, string[]>,
  rootPath: string = getRootPath()
): Promise<number> => {
  const versions: string[] = Array.from(versionsMap.keys());
  const subspaceCommonVersionsPath: string = getRushSubspaceCommonVersionsFilePath(subspaceName, rootPath);
  const subspaceCommonVersionsJson: RushSubspaceCommonVersionsJson = loadRushSubspaceCommonVersions(
    subspaceName,
    rootPath
  );

  const newValidVersions: string[] = rSortVersions(versions).reduce<string[]>((prevVersions, currVersion) => {
    const newVersions: string[] = [...prevVersions];
    if (newVersions.includes(currVersion)) {
      // do nothing.
    } else if (RESERVED_VERSIONS.includes(currVersion)) {
      newVersions.push(currVersion);
    } else {
      // Find and replace versions with subset versions
      const newSubsetVersion: string | undefined = newVersions.find((newVersion) =>
        subsetVersion(newVersion, currVersion)
      );
      if (newSubsetVersion) {
        // Update projects with new subset version
        versionsMap.get(currVersion)?.forEach((projectName) => {
          if (updateProjectDependency(projectName, dependencyName, newSubsetVersion, rootPath)) {
            Console.debug(
              `Updated project ${Colorize.bold(projectName)} for dependency ${Colorize.bold(
                dependencyName
              )} ${Colorize.bold(currVersion)} => ${Colorize.bold(newSubsetVersion)}!`
            );
          }
        });
      }
    }

    return newVersions;
  }, []);

  const removedAlternativeVersionsCount: number = versions.length - newValidVersions.length;
  if (removedAlternativeVersionsCount > 0) {
    // Update subspace common versions
    if (newValidVersions.length > 0) {
      subspaceCommonVersionsJson.allowedAlternativeVersions![dependencyName] = newValidVersions;
    } else {
      delete subspaceCommonVersionsJson.allowedAlternativeVersions![dependencyName];
    }

    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath);
  }

  return removedAlternativeVersionsCount;
};

const removeDuplicatedDependencies = (subspaceName: string, rootPath: string = getRootPath()): void => {
  Console.log(`Removing duplicated dependencies for subspace ${Colorize.bold(subspaceName)}...`);

  const projects: IRushConfigurationProjectJson[] = queryProjectsFromSubspace(subspaceName, rootPath);
  let countRemoved: number = 0;
  projects.forEach((project) => {
    const projectPackageFilePath: string = getProjectPackageFilePath(project.projectFolder, rootPath);
    const projectPackageJson: IPackageJson = loadProjectPackageJson(project.projectFolder, rootPath);

    const dependencies: string[] = Object.keys(projectPackageJson.dependencies || {});
    const devDependencies: string[] = Object.keys(projectPackageJson.devDependencies || {});

    devDependencies.forEach((devDependency) => {
      if (dependencies.includes(devDependency)) {
        countRemoved += 1;
        Console.debug(
          `Removed ${Colorize.bold(devDependency)} from project ${Colorize.bold(project.packageName)}`
        );
        delete projectPackageJson.devDependencies![devDependency];
      }
    });

    JsonFile.save(projectPackageJson, projectPackageFilePath);
  });

  if (countRemoved > 0) {
    Console.success(
      `Removed ${Colorize.bold(`${countRemoved}`)} duplicated dependencies from subspace ${Colorize.bold(
        subspaceName
      )}!`
    );
  } else {
    Console.success(`No duplicated dependencies found for subspace ${Colorize.bold(subspaceName)}!`);
  }
};

const removeUnusedAlternativeVersions = (
  subspaceName: string,
  subspaceDependencies: Map<string, Map<string, string[]>>
): void => {
  Console.log(`Removing unused alternative versions for subspace ${Colorize.bold(subspaceName)}...`);

  const subspaceCommonVersionsPath: string = getRushSubspaceCommonVersionsFilePath(subspaceName);
  const subspaceCommonVersionsJson: RushSubspaceCommonVersionsJson =
    loadRushSubspaceCommonVersions(subspaceName);

  if (!subspaceCommonVersionsJson.allowedAlternativeVersions) {
    return;
  }

  let countRemoved: number = 0;

  for (const [dependency, alternativeVersions] of Object.entries(
    subspaceCommonVersionsJson.allowedAlternativeVersions
  )) {
    const subspaceDependency: Map<string, string[]> | undefined = subspaceDependencies.get(dependency);
    const newAlternativeVersions: string[] =
      subspaceDependency && subspaceDependency.size > 1
        ? alternativeVersions.filter((version) => subspaceDependency.has(version))
        : [];

    const removedAlternativeVersionsCount: number =
      alternativeVersions.length - newAlternativeVersions.length;
    if (removedAlternativeVersionsCount > 0) {
      countRemoved += removedAlternativeVersionsCount;
      Console.debug(
        `Moving from [${Colorize.bold(alternativeVersions.join(','))}] to [${Colorize.bold(
          newAlternativeVersions.join(',')
        )}] for dependency ${Colorize.bold(dependency)}`
      );
    }

    if (newAlternativeVersions.length === 0) {
      delete subspaceCommonVersionsJson.allowedAlternativeVersions[dependency];
      continue;
    }

    subspaceCommonVersionsJson.allowedAlternativeVersions = {
      ...subspaceCommonVersionsJson.allowedAlternativeVersions,
      [dependency]: newAlternativeVersions
    };
  }

  if (countRemoved > 0) {
    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath);
    Console.success(
      `Removed ${Colorize.bold(`${countRemoved}`)} unused alternative versions from subspace ${Colorize.bold(
        subspaceName
      )}!`
    );
  } else {
    Console.success(`No unused alternative versions found for subspace ${Colorize.bold(subspaceName)}!`);
  }
};

const removeSupersetDependencyVersions = async (
  subspaceName: string,
  subspaceDependencies: Map<string, Map<string, string[]>>
): Promise<void> => {
  const multipleVersionDependencies: string[] = Array.from(subspaceDependencies.keys()).filter(
    (dependency) => subspaceDependencies.get(dependency)!.size > 1
  );

  if (multipleVersionDependencies.length === 0) {
    Console.success(
      `The subspace ${Colorize.bold(subspaceName)} doesn't contain alternative versions! Exiting...`
    );
    return;
  }

  if (await scanForAllDependenciesPrompt()) {
    Console.log(`Removing superset versions for subspace ${Colorize.bold(subspaceName)}...`);
    await Promise.all(
      Array.from(subspaceDependencies.entries()).map(([dependency, versionsMap]) =>
        removeSupersetDependency(subspaceName, dependency, versionsMap)
      )
    ).then((countPerDependency) => {
      const count: number = countPerDependency.reduce((a, b) => a + b, 0);
      if (count > 0) {
        Console.success(`Removed ${Colorize.bold(`${count}`)} superset alternative versions!`);
      } else {
        Console.success(`No alternative versions have been removed!`);
      }
    });

    return;
  }

  do {
    const selectedDependency: string = await chooseDependencyPrompt(multipleVersionDependencies);

    Console.log(`Removing superset versions for dependency ${Colorize.bold(selectedDependency)}...`);
    const count: number = await removeSupersetDependency(
      subspaceName,
      selectedDependency,
      subspaceDependencies.get(selectedDependency) as Map<string, string[]>
    );

    if (count > 0) {
      Console.success(
        `Removed ${Colorize.bold(`${count}`)} superset alternative versions for dependency ${Colorize.bold(
          selectedDependency
        )}!`
      );
    } else {
      Console.success(
        `No alternative versions have been removed for dependency ${Colorize.bold(selectedDependency)}!`
      );
    }

    const index: number = multipleVersionDependencies.indexOf(selectedDependency);
    multipleVersionDependencies.splice(index, 1);
  } while (multipleVersionDependencies.length > 0 && (await confirmNextDependencyPrompt()));
};

export const cleanSubspace = async (): Promise<void> => {
  Console.debug('Executing clean subspace command...');

  const targetSubspaces: string[] = querySubspaces();
  if (!isSubspaceSupported()) {
    Console.error(
      `The monorepo ${Colorize.bold(
        getRootPath()
      )} doesn't support subspaces! Make sure you have ${Colorize.bold(
        getRushSubspacesConfigurationJsonPath()
      )} with the ${Colorize.bold(RushConstants.defaultSubspaceName)} subspace. Exiting...`
    );
    return;
  }

  const targetSubspace: string = await chooseSubspacePrompt(targetSubspaces);
  Console.title(`🛁 Cleaning subspace ${Colorize.underline(targetSubspace)} alternative versions...`);

  let subspaceDependencies: Map<string, Map<string, string[]>> = getSubspaceDependencies(targetSubspace);
  if (await scanForDuplicatedDependenciesPrompt()) {
    removeDuplicatedDependencies(targetSubspace);
    subspaceDependencies = getSubspaceDependencies(targetSubspace);
  }

  if (await scanForSupersetDependencyVersionsPrompt()) {
    await removeSupersetDependencyVersions(targetSubspace, subspaceDependencies);
    subspaceDependencies = getSubspaceDependencies(targetSubspace);
  }

  if (await scanForUnusedDependencyVersionsPrompt()) {
    removeUnusedAlternativeVersions(targetSubspace, subspaceDependencies);
  }

  Console.warn(
    `Please run "rush update --subspace ${targetSubspace}" to update the subspace shrinkwrap file.`
  );
};
