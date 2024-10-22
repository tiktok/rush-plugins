import { FileSystem, JsonFile } from '@rushstack/node-core-library';
import { RushPathConstants } from '../constants/paths';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';

export const isSubspaceSupported = (): boolean => {
  return (
    FileSystem.exists(RushPathConstants.SubspacesConfigurationJson) &&
    FileSystem.exists(RushPathConstants.DefaultSubspaceConfigurationFolder)
  );
};

export const querySubspaces = (): string[] => {
  const subspaceJson: ISubspacesConfigurationJson = JsonFile.load(
    RushPathConstants.SubspacesConfigurationJson
  );

  return subspaceJson.subspaceNames;
};
