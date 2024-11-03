import inquirer from 'inquirer';
import { basename } from 'path';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';

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

export const chooseSyncCommandPrompt = async (projectName: string): Promise<string> => {
  const { command } = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What would you like to do?',
      suffix: ` (Project: ${Colorize.bold(projectName)})`,
      choices: [
        { name: 'Fix version mismatches', value: 'fix' },
        { name: 'Report version mismatches', value: 'report' },
        { name: 'Skip', value: 'skip' }
      ]
    }
  ]);

  return command;
};

export const confirmNextProjectToAddPrompt = async (subspaceName: string): Promise<boolean> => {
  const { confirmNext } = await inquirer.prompt([
    {
      message: `Do you want to add another project to the subspace?`,
      suffix: ` (Current subspace: ${Colorize.bold(subspaceName)})`,
      type: 'confirm',
      name: 'confirmNext',
      default: true
    }
  ]);

  return confirmNext;
};

export const confirmNextProjectToSyncPrompt = async (subspaceName: string): Promise<boolean> => {
  const { confirmNext } = await inquirer.prompt([
    {
      message: `Do you want to fix another mismatched project?`,
      suffix: ` (Current subspace: ${Colorize.bold(subspaceName)})`,
      type: 'confirm',
      name: 'confirmNext',
      default: true
    }
  ]);

  return confirmNext;
};
