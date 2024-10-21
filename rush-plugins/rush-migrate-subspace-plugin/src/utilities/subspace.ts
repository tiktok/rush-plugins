import { FileSystem } from '@rushstack/node-core-library';
import { RushPathConstants } from '../constants/paths';

export const isSubspaceSupported = (): boolean => {
  return (
    FileSystem.exists(RushPathConstants.SubspacesConfigurationJson) &&
    FileSystem.exists(RushPathConstants.DefaultSubspaceConfigurationFolder)
  );
};
