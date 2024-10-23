import { FileSystem } from '@rushstack/node-core-library';
import { createSubspace } from './createSubspace';
import Console from '../providers/console';
import { RushConstants } from '@rushstack/rush-sdk';
import { getRushConfigurationJsonPath } from '../utilities/repository';
import { getRushSubspaceConfigurationFolderPath } from '../utilities/subspace';

export const initSubspaces = async (): Promise<void> => {
  Console.debug(`Starting subspaces...`);

  const subspacesConfigurationJsonPath: string = getRushConfigurationJsonPath();
  if (!FileSystem.exists(subspacesConfigurationJsonPath)) {
    FileSystem.copyFile({
      sourcePath: FileSystem.getRealPath(`${__dirname}/../templates/subspaces.json`),
      destinationPath: subspacesConfigurationJsonPath
    });

    Console.success('subspaces.json file created successfully!');
  }

  if (!FileSystem.exists(getRushSubspaceConfigurationFolderPath(RushConstants.defaultSubspaceName))) {
    await createSubspace(RushConstants.defaultSubspaceName);
  }
};
