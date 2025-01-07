import { JsonFile } from '@rushstack/node-core-library';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { RushPathConstants } from '../constants/paths';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { RushConstants } from '@rushstack/rush-sdk';

export const getRushConfigurationJsonPath = (rootPath: string): string =>
  `${rootPath}/${RushConstants.rushJsonFilename}`;

export const getRushSubspacesConfigurationJsonPath = (rootPath: string): string =>
  `${rootPath}/${RushPathConstants.SubspacesConfigurationFilePath}`;

export const loadRushConfiguration = (rootPath: string): IRushConfigurationJson => {
  return JsonFile.load(getRushConfigurationJsonPath(rootPath));
};
export const loadRushSubspacesConfiguration = (rootPath: string): ISubspacesConfigurationJson => {
  return JsonFile.load(getRushSubspacesConfigurationJsonPath(rootPath));
};

export const querySubspaces = (rootPath: string): string[] => {
  const subspaceJson: ISubspacesConfigurationJson = loadRushSubspacesConfiguration(rootPath);
  return subspaceJson.subspaceNames;
};

export const isExternalMonorepo = (sourceRootPath: string, targetRootPath: string): boolean => {
  return sourceRootPath !== targetRootPath;
};
