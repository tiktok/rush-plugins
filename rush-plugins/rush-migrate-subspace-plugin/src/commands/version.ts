import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import inquirer from 'inquirer';

export const requestVersionType = async (
  availableVersions: string[],
  mismatchVersionMap: ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
): Promise<string> => {
  const { versionToSync } = await inquirer.prompt([
    {
      type: 'list',
      name: 'versionToSync',
      message: 'Which version would you like to sync all the packages to?',
      choices: [
        ...availableVersions.map((ver) => {
          const packagesWithVersion: readonly VersionMismatchFinderEntity[] =
            mismatchVersionMap.get(ver) || [];
          return {
            value: ver,
            name: `${ver} - used by ${packagesWithVersion.length} packages.`
          };
        }),
        { name: 'Manual Entry', value: 'manual' },
        { name: 'Skip this package', value: 'skip' },
        { name: 'Add versions to allowedAlternativeVersions', value: 'alternative' }
      ]
    }
  ]);

  return versionToSync;
};

export const enterVersion = async (dependencyName: string): Promise<string> => {
  const { newVersion } = await inquirer.prompt([
    {
      type: 'input',
      name: 'newVersion',
      message: `Please enter the version you wish to set for the ${dependencyName} package.`
    }
  ]);

  return newVersion;
};
