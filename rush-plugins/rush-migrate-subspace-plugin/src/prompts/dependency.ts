import { Colorize } from '@rushstack/terminal';
import inquirer from 'inquirer';
import { sortVersions } from '../utilities/dependency';

export const confirmNextDependencyPrompt = async (suffix?: string): Promise<boolean> => {
  const { confirmNext } = await inquirer.prompt([
    {
      message: `Do you want to choose another dependency?`,
      suffix,
      type: 'confirm',
      name: 'confirmNext',
      default: true
    }
  ]);

  return confirmNext;
};

export const chooseVersionPrompt = async (
  availableVersionsMap: Map<string, string[]>,
  currentVersion: string,
  recommendedVersion?: string
): Promise<string> => {
  const availableVersions: string[] = sortVersions(Array.from(availableVersionsMap.keys()));
  const actionAlternative: { name: string; value: string } = {
    name: 'Add current to allowedAlternativeVersions',
    value: 'alternative'
  };

  const { versionToSync } = await inquirer.prompt([
    {
      type: 'list',
      name: 'versionToSync',
      message: `Which version would you like to use?`,
      suffix: ` (Current version: ${Colorize.bold(currentVersion)})`,
      choices: [
        ...(recommendedVersion
          ? [
              { type: 'separator', line: '==== Recommended version:' },
              { name: recommendedVersion, value: recommendedVersion }
            ]
          : [{ type: 'separator', line: '==== Recommended action:' }, actionAlternative]),
        { type: 'separator', line: '==== All versions:' },
        ...availableVersions.map((version) => {
          const projects: string[] = availableVersionsMap.get(version) || [];

          let name: string = `${version} - used by ${projects.join(', ')}`;
          if (projects.length > 4) {
            name = `${version} - used by ${projects.length} projects`;
          } else if (projects.length === 0) {
            name = version;
          }

          return {
            name,
            value: version
          };
        }),
        { type: 'separator', line: '==== Other options:' },
        actionAlternative,
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

export const chooseDependencyPrompt = async (dependencies: string[], suffix?: string): Promise<string> => {
  const { dependencyInput } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dependencyInput',
      message: `Please select the dependency name (Type to filter).`,
      suffix,

      choices: dependencies.sort().map((name) => ({ name, value: name }))
    }
  ]);

  return dependencyInput;
};

export const confirmSaveReportPrompt = async (): Promise<boolean> => {
  const { saveToFile } = await inquirer.prompt([
    {
      message: 'Do you want to output the results to a JSON file?',
      type: 'confirm',
      name: 'saveToFile'
    }
  ]);

  return saveToFile;
};

export const enterReportFileLocationPrompt = async (defaultFileName: string): Promise<string> => {
  const { filePath } = await inquirer.prompt([
    {
      message: `Please enter the file path to save this file. Please do not commit it to git.`,
      type: 'input',
      name: 'filePath',
      default: defaultFileName
    }
  ]);

  return filePath;
};
