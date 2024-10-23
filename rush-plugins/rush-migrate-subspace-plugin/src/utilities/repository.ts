import { JsonFile } from '@rushstack/node-core-library';
import { getRootPath } from './path';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { RushPathConstants } from '../constants/paths';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { RushConstants } from '@rushstack/rush-sdk';

export const getRushConfigurationJsonPath = (rootPath: string = getRootPath()): string =>
  `${rootPath}/${RushConstants.rushJsonFilename}`;

export const getRushSubspacesConfigurationJsonPath = (rootPath: string = getRootPath()): string =>
  `${rootPath}/${RushPathConstants.SubspacesConfigurationFilePath}`;

export const loadRushConfiguration = (rootPath: string = getRootPath()): IRushConfigurationJson => {
  return JsonFile.load(getRushConfigurationJsonPath(rootPath));
};
export const loadRushSubspacesConfiguration = (
  rootPath: string = getRootPath()
): ISubspacesConfigurationJson => {
  return JsonFile.load(getRushSubspacesConfigurationJsonPath(rootPath));
};

export const querySubspaces = (rootPath: string = getRootPath()): string[] => {
  const subspaceJson: ISubspacesConfigurationJson = loadRushSubspacesConfiguration(rootPath);
  return subspaceJson.subspaceNames;
};
