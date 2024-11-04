import { FileSystem, IPackageJsonDependencyTable, JsonFile } from '@rushstack/node-core-library';
import { RushNameConstants, RushPathConstants } from '../constants/paths';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { getRootPath } from './path';
import {
  getRushConfigurationJsonPath,
  getRushSubspacesConfigurationJsonPath,
  loadRushConfiguration,
  loadRushSubspacesConfiguration,
  querySubspaces
} from './repository';
import { RushConstants } from '@rushstack/rush-sdk';
import { IRushConfigurationJson, RushConfiguration } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { VersionMismatchFinder } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinder';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getProjectDependencies } from './project';
import { sortVersions, subsetVersion } from './dependency';

export const queryProjectsFromSubspace = (
  targetSubspaceName: string,
  rootPath: string = getRootPath()
): IRushConfigurationProjectJson[] => {
  const rushConfig: IRushConfigurationJson = loadRushConfiguration(rootPath);
  return rushConfig.projects.filter(({ subspaceName }) => subspaceName === targetSubspaceName);
};

const getRushLegacySubspaceConfigurationFolderPath = (
  subspaceName: string,
  projectFolderPath: string,
  rootPath: string = getRootPath()
): string => {
  return `${rootPath}/${projectFolderPath}/subspace/${subspaceName}`;
};

export const getRushSubspaceConfigurationFolderPath = (
  subspaceName: string,
  rootPath: string = getRootPath(),
  projectFolderPath?: string
): string => {
  if (projectFolderPath) {
    /** @deprecated This is a legacy path that is used by the tiktok_web_monorepo. */
    const legacyConfigurationFolderPath: string = getRushLegacySubspaceConfigurationFolderPath(
      subspaceName,
      projectFolderPath,
      rootPath
    );
    if (FileSystem.exists(legacyConfigurationFolderPath)) {
      return legacyConfigurationFolderPath;
    }
  }

  return `${rootPath}/${RushPathConstants.SubspacesConfigurationFolderPath}/${subspaceName}`;
};

export const getRushSubspaceCommonVersionsFilePath = (
  subspaceName: string,
  rootPath: string = getRootPath()
): string => {
  return `${getRushSubspaceConfigurationFolderPath(subspaceName, rootPath)}/${
    RushConstants.commonVersionsFilename
  }`;
};

export const loadRushSubspaceCommonVersions = (
  subspaceName: string,
  rootPath: string = getRootPath()
): RushSubspaceCommonVersionsJson => {
  return JsonFile.load(getRushSubspaceCommonVersionsFilePath(subspaceName, rootPath));
};

export const getRushSubspacePnpmFilePath = (
  subspaceName: string,
  rootPath: string = getRootPath()
): string => {
  return `${getRushSubspaceConfigurationFolderPath(subspaceName, rootPath)}/${
    RushNameConstants.PnpmSubspaceFileName
  }`;
};

export const loadRushSubspacePnpm = (
  subspaceName: string,
  rootPath: string = getRootPath()
): RushSubspaceCommonVersionsJson => {
  return JsonFile.load(getRushSubspacePnpmFilePath(subspaceName, rootPath));
};

export const getRushSubspaceNpmRcFilePath = (
  subspaceName: string,
  rootPath: string = getRootPath()
): string => {
  return `${getRushSubspaceConfigurationFolderPath(subspaceName, rootPath)}/${
    RushNameConstants.NpmRcFileName
  }`;
};

export const loadRushSubspaceNpmRc = (
  subspaceName: string,
  rootPath: string = getRootPath()
): RushSubspaceCommonVersionsJson => {
  return JsonFile.load(getRushSubspaceNpmRcFilePath(subspaceName, rootPath));
};

export const isSubspaceSupported = (rootPath: string = getRootPath()): boolean => {
  if (
    FileSystem.exists(getRushSubspacesConfigurationJsonPath(rootPath)) &&
    FileSystem.exists(getRushSubspaceConfigurationFolderPath(RushConstants.defaultSubspaceName, rootPath))
  ) {
    const subspacesConfig: ISubspacesConfigurationJson = loadRushSubspacesConfiguration();
    return subspacesConfig.subspacesEnabled;
  }

  return false;
};

export const subspaceExists = (subspaceName: string, rootPath: string = getRootPath()): boolean => {
  const subspaces: string[] = querySubspaces(rootPath);
  return !!subspaces.find((name) => name === subspaceName);
};

export const getSubspaceMismatches = (
  subspaceName: string,
  rootPath: string = getRootPath()
): ReadonlyMap<string, ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>> => {
  const rushConfig: RushConfiguration = RushConfiguration.loadFromConfigurationFile(
    getRushConfigurationJsonPath(rootPath)
  );

  const { mismatches } = VersionMismatchFinder.getMismatches(rushConfig, {
    variant: undefined,
    subspace: rushConfig.getSubspace(subspaceName)
  });

  return mismatches;
};

export const getSubspaceDependencies = (
  subspaceName: string,
  rootPath: string = getRootPath()
): Map<string, Map<string, string[]>> => {
  const subspaceProjects: IRushConfigurationProjectJson[] = queryProjectsFromSubspace(subspaceName, rootPath);
  const subspaceDependencies: Map<string, Map<string, string[]>> = new Map<string, Map<string, string[]>>();

  for (const project of subspaceProjects) {
    const projectDependencies: IPackageJsonDependencyTable | undefined = getProjectDependencies(
      project.packageName,
      rootPath
    );

    if (projectDependencies) {
      for (const [dependency, version] of Object.entries(projectDependencies)) {
        const subspaceDependency: Map<string, string[]> | undefined =
          subspaceDependencies.get(dependency) || new Map<string, string[]>();
        const subspaceDependencyProjects: string[] = subspaceDependency.get(version) || [];
        subspaceDependency.set(version, [...subspaceDependencyProjects, project.packageName]);
        subspaceDependencies.set(dependency, subspaceDependency);
      }
    }
  }

  return subspaceDependencies;
};

const reduceSubspaceDependencyVersions = (versions: string[]): string[] => {
  const validVersions: string[] = sortVersions(versions);

  let targetIndex: number = 0;
  while (targetIndex < validVersions.length) {
    const targetVersion: string = validVersions[targetIndex];
    const toCompareVersions: string[] = validVersions.slice(targetIndex + 1);

    const toDeleteIndex: number = toCompareVersions.findIndex((toCompareVersion) =>
      subsetVersion(toCompareVersion, targetVersion)
    );

    if (toDeleteIndex > -1) {
      validVersions.splice(targetIndex + 1 + toDeleteIndex, 1);
    } else {
      targetIndex += 1;
    }
  }

  return validVersions;
};

export const cleanSubspaceCommonVersions = (
  subspaceName: string,
  rootPath: string = getRootPath()
): boolean => {
  let hasChanged: boolean = false;
  const subspaceCommonVersionsPath: string = getRushSubspaceCommonVersionsFilePath(subspaceName, rootPath);
  const subspaceCommonVersionsJson: RushSubspaceCommonVersionsJson = loadRushSubspaceCommonVersions(
    subspaceName,
    rootPath
  );

  subspaceCommonVersionsJson.allowedAlternativeVersions =
    subspaceCommonVersionsJson.allowedAlternativeVersions || {};
  for (const [dependency, versions] of Object.entries(
    subspaceCommonVersionsJson.allowedAlternativeVersions
  )) {
    // Remove duplicates & unnecessary versions
    const validVersions: string[] = reduceSubspaceDependencyVersions(versions);
    if (validVersions.length === 0) {
      delete subspaceCommonVersionsJson.allowedAlternativeVersions[dependency];
    } else {
      subspaceCommonVersionsJson.allowedAlternativeVersions[dependency] = validVersions;
    }

    hasChanged = hasChanged || validVersions.length !== versions.length;
  }

  if (hasChanged) {
    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath);
    return true;
  }

  return false;
};
