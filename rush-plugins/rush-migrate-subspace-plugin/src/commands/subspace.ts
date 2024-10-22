import inquirer from 'inquirer';
import { querySubspaces } from '../utilities/subspace';

export const chooseSubspace = async (): Promise<string> => {
  const allSubspaces: string[] = querySubspaces();

  const { subspaceNameInput } = await inquirer.prompt([
    {
      message: 'Please select the subspace name (Type to filter).',
      type: 'search-list',
      name: 'subspaceNameInput',
      choices: allSubspaces.map((name) => ({ name, value: name }))
    }
  ]);

  return subspaceNameInput;
};

export const createSubspace = async (): Promise<string> => {
  const { subspaceNameInput } = await inquirer.prompt([
    {
      message: 'Please enter the new subspace name (lowercase letters with underscores (_) are allowed).',
      name: 'subspaceNameInput',
      type: 'input'
    }
  ]);

  return subspaceNameInput;
};

export const enterSubspaceSelection = async (): Promise<string> => {
  const { subspaceSelection } = await inquirer.prompt([
    {
      message:
        'Would you like to migrate a package to an existing subspace, or create a new subspace with this package?',
      name: 'subspaceSelection',
      type: 'list',
      choices: [
        {
          name: 'Select an existing subspace',
          value: 'existing'
        },
        {
          name: 'Create a new subspace',
          value: 'new'
        }
      ]
    }
  ]);

  return subspaceSelection;
};
