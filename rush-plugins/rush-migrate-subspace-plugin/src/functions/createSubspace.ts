import { FileSystem, JsonFile } from '@rushstack/node-core-library';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import {
  getRushSubspacesConfigurationJsonPath,
  loadRushSubspacesConfiguration
} from '../utilities/repository';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { getRushSubspaceConfigurationFolderPath } from '../utilities/subspace';

export const createSubspace = async (subspaceName: string, rootPath: string): Promise<void> => {
  Console.debug(`Creating subspace ${Colorize.bold(subspaceName)}...`);
  const subspaceConfigFolder: string = getRushSubspaceConfigurationFolderPath(subspaceName, rootPath);
  FileSystem.ensureFolder(subspaceConfigFolder);

  const files: string[] = ['.npmrc', 'common-versions.json', 'repo-state.json'];
  for (const file of files) {
    if (!FileSystem.exists(`${subspaceConfigFolder}/${file}`)) {
      FileSystem.copyFile({
        sourcePath: FileSystem.getRealPath(`${__dirname}/../templates/${file}`),
        destinationPath: `${subspaceConfigFolder}/${file}`
      });
    }
  }

  const subspacesConfigJson: ISubspacesConfigurationJson = loadRushSubspacesConfiguration(rootPath);
  if (!subspacesConfigJson.subspaceNames.includes(subspaceName)) {
    Console.debug(
      `Updating ${getRushSubspacesConfigurationJsonPath(rootPath)} by adding ${Colorize.bold(
        subspaceName
      )}...`
    );
    const newSubspacesConfigJson: ISubspacesConfigurationJson = {
      ...subspacesConfigJson,
      subspaceNames: [...subspacesConfigJson.subspaceNames, subspaceName]
    };

    JsonFile.save(newSubspacesConfigJson, getRushSubspacesConfigurationJsonPath(rootPath), {
      updateExistingFile: true
    });
  }

  Console.warn(
    `Run "rush update --full --subspace ${subspaceName}" to update the subspace that this project is migrating from.`
  );

  Console.success(`${Colorize.bold(subspaceName)} subspace created successfully!`);
};
