import inquirer from 'inquirer';

export const chooseSubspacePrompt = async (subspaces: string[]): Promise<string> => {
  const { subspaceNameInput } = await inquirer.prompt([
    {
      message: 'Please select the subspace name (Type to filter).',
      type: 'search-list',
      name: 'subspaceNameInput',
      choices: subspaces.sort().map((name) => ({ name, value: name }))
    }
  ]);

  return subspaceNameInput;
};

export const createSubspacePrompt = async (subspaces: string[]): Promise<string> => {
  const { subspaceNameInput } = await inquirer.prompt([
    {
      message: 'Please enter the new subspace name (lowercase letters with underscores (_) are allowed).',
      name: 'subspaceNameInput',
      type: 'input',
      validate: (input) => {
        if (!/^[a-z_]+$/.test(input)) {
          return 'Subspace name must be lowercase letters with underscores (_).';
        } else if (subspaces.find((name) => name === input)) {
          return `The subspace ${input} already exists. Please enter a new subspace name.`;
        }

        return true;
      }
    }
  ]);

  return subspaceNameInput;
};

export const chooseCreateOrSelectSubspacePrompt = async (subspaces: string[]): Promise<string> => {
  const { subspaceSelection } = await inquirer.prompt([
    {
      message: 'Would you like to migrate a package to an existing subspace, or create a new subspace?',
      name: 'subspaceSelection',
      type: 'list',
      choices: [
        {
          name: 'Select an existing subspace',
          value: 'existing',
          disabled: subspaces.length === 0
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
