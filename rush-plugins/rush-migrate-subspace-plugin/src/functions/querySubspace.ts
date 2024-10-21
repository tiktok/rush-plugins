import inquirer from 'inquirer';
import { JsonFile } from '@rushstack/node-core-library';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { RushPathConstants } from '../constants/paths';

export const querySubspace = async (): Promise<string> => {
  const subspaceJson: ISubspacesConfigurationJson = JsonFile.load(
    RushPathConstants.SubspacesConfigurationJson
  );

  const { subspaceNameInput } = await inquirer.prompt([
    {
      message: 'Please select the subspace name you wish to add to (Type to filter).',
      type: 'search-list',
      name: 'subspaceNameInput',
      choices: subspaceJson.subspaceNames.map((name: string) => ({ name, value: name }))
    }
  ]);

  return subspaceNameInput;
};
