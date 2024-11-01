import inquirer from 'inquirer';

export const requestVersionTypePrompt = async (
  availableVersions: { name: string; value: string }[]
): Promise<string> => {
  const { versionToSync } = await inquirer.prompt([
    {
      type: 'list',
      name: 'versionToSync',
      message: 'Which version would you like to use?',
      choices: [
        ...availableVersions,
        { name: 'Add manual version', value: 'manual' },
        { name: 'Skip this dependency', value: 'skip' },
        { name: 'Create exception (allowedAlternativeVersions)', value: 'alternative' }
      ]
    }
  ]);

  return versionToSync;
};

export const enterVersionPrompt = async (dependencyName: string): Promise<string> => {
  const { newVersion } = await inquirer.prompt([
    {
      type: 'input',
      name: 'newVersion',
      message: `Please enter the version you wish to set for the ${dependencyName} package.`
    }
  ]);

  return newVersion;
};

export const chooseDependencyPrompt = async (dependencies: string[]): Promise<string> => {
  const { dependencyInput } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dependencyInput',
      message: `Please enter the package you wish to fix the mismatch.`,
      choices: dependencies.map((name) => ({ name, value: name }))
    }
  ]);

  return dependencyInput;
};
