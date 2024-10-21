import inquirer from 'inquirer';
import { JsonFile } from '@rushstack/node-core-library';
import { getRootPath } from '../utilities/getRootPath';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';

/**
 * This function will query the user for a subspace name, and return it. It accepts a set of subspace names
 * that should not be shown in the dropdown.
 */
export const querySubspace = async (): Promise<string> => {
  const subspaceJson: ISubspacesConfigurationJson = JsonFile.load(
    `${getRootPath()}/common/config/rush/subspaces.json`
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
