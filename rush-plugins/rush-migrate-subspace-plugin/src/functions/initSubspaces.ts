import { FileSystem } from '@rushstack/node-core-library';
import { createSubspace } from './createSubspace';
import Console from '../providers/console';
import { RushConstants } from '@rushstack/rush-sdk';
import { getRushSubspacesConfigurationJsonPath } from '../utilities/repository';
import { getRushSubspaceConfigurationFolderPath } from '../utilities/subspace';
import chalk from 'chalk';
import { getRootPath } from '../utilities/path';

export const initSubspaces = async (): Promise<void> => {
  Console.debug(`Starting subspaces feature on ${chalk.bold(getRootPath())}...`);

  const subspacesConfigurationJsonPath: string = getRushSubspacesConfigurationJsonPath();
  if (!FileSystem.exists(subspacesConfigurationJsonPath)) {
    FileSystem.copyFile({
      sourcePath: FileSystem.getRealPath(`${__dirname}/../templates/subspaces.json`),
      destinationPath: subspacesConfigurationJsonPath
    });

    Console.success(`${chalk.bold(subspacesConfigurationJsonPath)} file created successfully!`);
  }

  if (!FileSystem.exists(getRushSubspaceConfigurationFolderPath(RushConstants.defaultSubspaceName))) {
    await createSubspace(RushConstants.defaultSubspaceName);
  }
};
