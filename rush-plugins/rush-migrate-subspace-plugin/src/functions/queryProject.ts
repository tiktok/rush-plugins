import inquirer from 'inquirer';
import { JsonFile } from '@rushstack/node-core-library';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { RushPathConstants } from '../constants/paths';

export const queryProject = async (
  message: string,
  filterFn: (project: IRushConfigurationProjectJson) => boolean = () => true
): Promise<string> => {
  const rushJson: IRushConfigurationJson = JsonFile.load(RushPathConstants.RushConfigurationJson);
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
