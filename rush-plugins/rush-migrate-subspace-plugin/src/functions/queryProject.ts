import inquirer from 'inquirer';
import { getRootPath } from '../utilities/getRootPath';
import { JsonFile } from '@rushstack/node-core-library';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';

export const queryProject = async (
  message: string,
  filterFn: (project: any) => boolean = () => true
): Promise<string> => {
  const rushJson: IRushConfigurationJson = JsonFile.load(`${getRootPath()}/rush.json`);
  const { projectToAdd } = await inquirer.prompt([
    {
      message,
      type: 'search-list',
      name: 'projectToAdd',
      choices: rushJson.projects
        .filter(filterFn)
        .map((project) => ({ name: project.packageName, value: project.packageName }))
    }
  ]);

  return projectToAdd;
};
