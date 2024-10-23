import inquirer from 'inquirer';
import { getRootPath } from '../utilities/path';
import { FileSystem } from '@rushstack/node-core-library';

export const chooseRepositoryPrompt = async (): Promise<string> => {
  const { repoPathInput } = await inquirer.prompt([
    {
      message: 'Please enter the repository root path.',
      type: 'input',
      name: 'repoPathInput',
      default: getRootPath(),
      validate: (input) => {
        if (!FileSystem.exists(input)) {
          return 'The path does not exist. Please enter a valid path.';
        } else if (!FileSystem.exists(`${input}/rush.json`)) {
          return "This repository doesn't contain rush.json. Please enter a valid path.";
        }

        return true;
      }
    }
  ]);

  return FileSystem.getRealPath(repoPathInput);
};
