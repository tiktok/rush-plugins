import { FileSystem } from '@rushstack/node-core-library';
import { updateEdenProject } from './updateEdenProject';
import { RushNameConstants } from '../constants/paths';
import Console from '../providers/console';
import chalk from 'chalk';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { enterNewProjectLocationPrompt, moveProjectPrompt } from '../prompts/project';
import { queryProject } from '../utilities/project';
import { getRootPath } from '../utilities/path';
import { RushConstants } from '@rushstack/rush-sdk';
import { addProjectToRushConfiguration } from './updateRushConfiguration';
import { isExternalMonorepo } from '../utilities/repository';

const moveProjectToSubspaceFolder = async (
  sourceProjectFolderPath: string,
  targetSubspace: string
): Promise<string | undefined> => {
  const targetSubspaceFolderPath: string = `${getRootPath()}/${
    RushNameConstants.SubspacesFolderName
  }/${targetSubspace}`;

  const targetProjectFolderPath: string = await enterNewProjectLocationPrompt(
    sourceProjectFolderPath,
    targetSubspaceFolderPath
  );

  Console.debug(
    `Moving project from ${chalk.bold(sourceProjectFolderPath)} to ${chalk.bold(targetProjectFolderPath)}...`
  );

  if (!FileSystem.exists(sourceProjectFolderPath)) {
    Console.error(
      `The path ${chalk.bold(
        sourceProjectFolderPath
      )} doesn't exist! Please check if the "projectFolder" is correct on ${
        RushConstants.rushJsonFilename
      }. Skipping...`
    );
    return;
  }

  FileSystem.ensureFolder(targetProjectFolderPath);
  FileSystem.move({
    sourcePath: sourceProjectFolderPath,
    destinationPath: targetProjectFolderPath
  });

  const targetLegacySubspaceFolderPath: string = `${targetProjectFolderPath}/subspace`;
  if (FileSystem.exists(targetLegacySubspaceFolderPath)) {
    Console.debug(`Removing legacy subspace folder ${chalk.bold(targetLegacySubspaceFolderPath)}...`);
    FileSystem.deleteFolder(targetLegacySubspaceFolderPath);
  }

  return targetProjectFolderPath;
};

export const addProjectToSubspace = async (
  sourceProject: IRushConfigurationProjectJson,
  targetSubspace: string,
  sourceMonorepoPath: string
): Promise<void> => {
  Console.debug(
    `Adding project ${chalk.bold(sourceProject.packageName)} to subspace ${chalk.bold(targetSubspace)}...\n`
  );

  let targetProjectFolderPath: string | undefined = `${getRootPath()}/${sourceProject.projectFolder}`;
  if (isExternalMonorepo(sourceMonorepoPath) || (await moveProjectPrompt())) {
    const sourceProjectFolderPath: string = `${sourceMonorepoPath}/${sourceProject.projectFolder}`;
    targetProjectFolderPath = await moveProjectToSubspaceFolder(sourceProjectFolderPath, targetSubspace);
    if (!targetProjectFolderPath) {
      return;
    }
  }

  addProjectToRushConfiguration(sourceProject, targetSubspace, targetProjectFolderPath);

  if (FileSystem.exists(`${getRootPath()}/${RushNameConstants.EdenMonorepoFileName}`)) {
    const targetProject: IRushConfigurationProjectJson = queryProject(
      sourceProject.packageName
    ) as IRushConfigurationProjectJson;
    await updateEdenProject(sourceProject, targetProject);
  }

  Console.success(
    `Project ${chalk.bold(sourceProject.packageName)} has been successfully added to subspace ${chalk.bold(
      targetSubspace
    )}.`
  );
};
