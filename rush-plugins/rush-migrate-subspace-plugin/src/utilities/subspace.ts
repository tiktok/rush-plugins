import { FileSystem } from '@rushstack/node-core-library';
import { RushPathConstants } from '../constants/paths';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { getRootPath } from './path';
import {
  getRushSubspacesConfigurationJsonPath,
  loadRushSubspacesConfiguration,
  querySubspaces
} from './repository';
import { RushConstants } from '@rushstack/rush-sdk';

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

export const querySubspace = (subspaceName: string, rootPath: string = getRootPath()): string | undefined => {
  const subspaces: string[] = querySubspaces(rootPath);
  return subspaces.find((name) => name === subspaceName);
};
