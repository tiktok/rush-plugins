import inquirer from 'inquirer';
import { JsonFile } from '@rushstack/node-core-library';
import { RootPath } from './getRootPath';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';

/**
 * This function will query the user for a subspace name, and return it. It accepts a set of subspace names
 * that should not be shown in the dropdown.
 */
export const querySubspace = async (): Promise<string> => {
  const subspaceJson: ISubspacesConfigurationJson = JsonFile.load(
    `${RootPath}/common/config/rush/subspaces.json`
  );

  const subspaceNames: string[] = subspaceJson.subspaceNames.filter(
    // TODO fix tiktok_web_monorepo
    (name: string) => !name.startsWith('split_') && name !== 'tiktok_web_monorepo'
  );

  const { subspaceNameInput } = await inquirer.prompt([
    {
      message: 'Please select the subspace name you wish to add to (Type to filter).',
      type: 'search-list',
      name: 'subspaceNameInput',
      choices: subspaceNames.map((name: string) => ({ name, value: name }))
    }
  ]);

  return subspaceNameInput;
};
