import inquirer from 'inquirer';
import { RootPath } from './getRootPath';
import { JsonFile } from '@rushstack/node-core-library';

export const queryProject = async (message: string, filterFn?: (project: any) => boolean) => {
  const rushJson = JsonFile.load(`${RootPath}/rush.json`);
  const filterFnToUse =
    filterFn ||
    function (project: any) {
      return true;
    };
  const { projectToAdd } = await inquirer.prompt([
    {
      message,
      type: 'search-list',
      name: 'projectToAdd',
      choices: rushJson.projects
        .filter(filterFnToUse)
        .map((project: any) => ({ name: project.packageName, value: project.packageName }))
    }
  ]);

  return projectToAdd;
};
