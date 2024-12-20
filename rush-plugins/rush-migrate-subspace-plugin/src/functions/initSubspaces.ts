import { FileSystem } from '@rushstack/node-core-library';
import { createSubspace } from './createSubspace';
import Console from '../providers/console';
import { RushConstants } from '@rushstack/rush-sdk';
import { getRushSubspacesConfigurationJsonPath } from '../utilities/repository';
import { getRushSubspaceConfigurationFolderPath } from '../utilities/subspace';
import { Colorize } from '@rushstack/terminal';

export const initSubspaces = async (rootPath: string): Promise<void> => {
  Console.debug(`Starting subspaces feature on ${Colorize.bold(rootPath)}...`);

  const subspacesConfigurationJsonPath: string = getRushSubspacesConfigurationJsonPath(rootPath);
  if (!FileSystem.exists(subspacesConfigurationJsonPath)) {
    FileSystem.copyFile({
      sourcePath: FileSystem.getRealPath(`${__dirname}/../templates/subspaces.json`),
      destinationPath: subspacesConfigurationJsonPath
    });

    Console.success(`${Colorize.bold(subspacesConfigurationJsonPath)} file created successfully!`);
  }

  if (
    !FileSystem.exists(getRushSubspaceConfigurationFolderPath(RushConstants.defaultSubspaceName, rootPath))
  ) {
    await createSubspace(RushConstants.defaultSubspaceName, rootPath);
  }
};
