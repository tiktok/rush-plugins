import inquirer from 'inquirer';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { basename } from 'path';
import Console from '../providers/console';

export const moveProjectPrompt = async (): Promise<boolean> => {
  const { moveProject } = await inquirer.prompt([
    {
      message: `Do you want to move this project's location?`,
      type: 'confirm',
      name: 'moveProject'
    }
  ]);

  return moveProject;
};

export const enterNewProjectLocationPrompt = async (
  sourceProjectFolderPath: string,
  targetSubspaceFolderPath: string
): Promise<string> => {
  const defaultProjectName: string = basename(sourceProjectFolderPath);
  const { projectFolderName } = await inquirer.prompt([
    {
      message: `Please enter the folder (or subfolder) you want to move this project to. ${Console.newLine()}${targetSubspaceFolderPath}/<your_project_folder>`,
      type: 'input',
      name: 'projectFolderName',
      default: defaultProjectName
    }
  ]);

  return `${targetSubspaceFolderPath}/${projectFolderName}`;
};

export const chooseProjectPrompt = async (projects: string[]): Promise<string> => {
  const { projectName } = await inquirer.prompt([
    {
      message: `Please select the project name (Type to filter).`,
      type: 'search-list',
      name: 'projectName',
      choices: projects.map((name) => ({ name, value: name }))
    }
  ]);

  return projectName;
};

export const confirmProjectSyncVersions = async (): Promise<boolean> => {
  const { confirmSync } = await inquirer.prompt([
    {
      message: `Do you want to start the mismatch fix?`,
      type: 'confirm',
      name: 'confirmSync',
      default: true
    }
  ]);

  return confirmSync;
};

export const confirmNextProjectPrompt = async (subspaceName: string): Promise<boolean> => {
  const { confirmNext } = await inquirer.prompt([
    {
      message: `Do you want to add another project to the ${subspaceName} subspace?`,
      type: 'confirm',
      name: 'confirmNext',
      default: true
    }
  ]);

  return confirmNext;
};
