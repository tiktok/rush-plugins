import { FileSystem } from '@rushstack/node-core-library';
import { RushPathConstants } from '../constants/paths';
import { startSubspace } from './startSubspace';
import chalk from 'chalk';

export const startSubspaces = async (): Promise<void> => {
  if (!FileSystem.exists(RushPathConstants.SubspacesConfigurationJson)) {
    FileSystem.copyFile({
      sourcePath: FileSystem.getRealPath(`${__dirname}/../templates/subspaces.json`),
      destinationPath: RushPathConstants.SubspacesConfigurationJson
    });

    console.log(chalk.green('subspaces.json file created successfully!'));
  }

  if (!FileSystem.exists(RushPathConstants.DefaultSubspaceFolder)) {
    await startSubspace('default');
  }
};
