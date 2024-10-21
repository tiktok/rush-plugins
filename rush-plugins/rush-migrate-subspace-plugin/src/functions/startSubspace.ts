import { FileSystem } from '@rushstack/node-core-library';
import chalk from 'chalk';
import { RushPathConstants } from '../constants/paths';

export const startSubspace = async (subspaceName: string): Promise<void> => {
  const subspaceConfigFolder: string = `${RushPathConstants.SubspacesConfigurationFolder}/${subspaceName}`;
  FileSystem.ensureFolder(subspaceConfigFolder);

  // Create the necessary files if they don't exist
  const files: string[] = ['.npmrc', 'common-versions.json', 'repo-state.json'];
  for (const file of files) {
    if (!FileSystem.exists(`${subspaceConfigFolder}/${file}`)) {
      FileSystem.copyFile({
        sourcePath: FileSystem.getRealPath(`${__dirname}/../templates/${file}`),
        destinationPath: `${subspaceConfigFolder}/${file}`
      });
    }
  }

  console.log(
    chalk.yellow(
      `Run "rush update --full --subspace ${subspaceName} to update the subspace that this project is migrating from.`
    )
  );
  console.log(chalk.green(`${subspaceName} subspace created successfully!`));
};
