import inquirer from 'inquirer';

export const chooseVersionPrompt = async (
  availableVersionsMap: Map<string, string[]>,
  currentVersion: string,
  recommendedVersion?: string
): Promise<string> => {
  const availableVersions: string[] = Array.from(availableVersionsMap.keys());
  const { versionToSync } = await inquirer.prompt([
    {
      type: 'list',
      name: 'versionToSync',
      message: `Which version would you like to use?`,
      suffix: `(Current version: ${currentVersion})`,
      choices: [
        ...(recommendedVersion
          ? [
              { type: 'separator', line: '==== Recommended version:' },
              { name: recommendedVersion, value: recommendedVersion }
            ]
          : []),
        { type: 'separator', line: '==== All versions:' },
        ...availableVersions.map((version) => {
          const projects: string[] = availableVersionsMap.get(version) || [];

          return {
            name: `${version} - used by ${
              projects.length > 4 ? `${projects.length} projects` : projects.join(',')
            }`,
            value: version
          };
        }),
        { type: 'separator', line: '==== Other options:' },
        { name: 'Add current to allowedAlternativeVersions', value: 'alternative' },
        { name: 'Add manual version', value: 'manual' },
        { name: 'Skip this dependency', value: 'skip' }
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
