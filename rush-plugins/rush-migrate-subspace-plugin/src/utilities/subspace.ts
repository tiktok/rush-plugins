import { FileSystem, IPackageJsonDependencyTable } from '@rushstack/node-core-library';
import { RushPathConstants } from '../constants/paths';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { getRootPath } from './path';
import {
  getRushConfigurationJsonPath,
  getRushSubspacesConfigurationJsonPath,
  loadRushSubspacesConfiguration,
  queryProjectsFromSubspace,
  querySubspaces
} from './repository';
import { RushConstants } from '@rushstack/rush-sdk';
import { RushConfiguration } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { VersionMismatchFinder } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinder';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getProjectDependencies } from './project';

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
    // DEPRECATED: This is a legacy path that is used by the tiktok_web_monorepo.
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
