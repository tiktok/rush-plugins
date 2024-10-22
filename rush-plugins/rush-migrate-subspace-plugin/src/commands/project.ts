import inquirer from 'inquirer';
import path from 'path';
import { RushPathConstants } from '../constants/paths';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';

export const moveProject = async (): Promise<boolean> => {
  const { moveProject } = await inquirer.prompt([
    {
      message: `Do you want to move this project's location?`,
      type: 'confirm',
      name: 'moveProject'
    }
  ]);

  return moveProject;
};

export const enterNewProjectLocation = async (
  project: IRushConfigurationProjectJson,
  subspaceName: string
): Promise<string> => {
  const { folder } = await inquirer.prompt([
    {
      message: `Please enter the folder (or subfolder) you want to move this project to. \n${`${RushPathConstants.SubspacesFolder}/${subspaceName}`}/<your_project_folder>`,
      type: 'input',
      name: 'folder',
      default: path.basename(project.projectFolder)
    }
  ]);

  return folder;
};

export const chooseProject = async (projects: IRushConfigurationProjectJson[]): Promise<string> => {
  const { projectNameInput } = await inquirer.prompt([
    {
      message: `Please select the project name (Type to filter).`,
      type: 'search-list',
      name: 'projectNameInput',
      choices: projects.map((project) => ({ name: project.packageName, value: project.packageName }))
    }
  ]);

  return projectNameInput;
};

export const confirmChooseProject = async (subspaceName: string): Promise<boolean> => {
  const { selectProject } = await inquirer.prompt([
    {
      message: `Do you want to add another project to the ${subspaceName} subspace?`,
      type: 'confirm',
      name: 'selectProject'
    }
  ]);

  return selectProject;
};
