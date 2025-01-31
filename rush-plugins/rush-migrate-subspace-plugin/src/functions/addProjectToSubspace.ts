import { FileSystem, JsonFile } from '@rushstack/node-core-library';
import { updateEdenProject } from './updateEdenProject';
import { RushNameConstants } from '../constants/paths';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { enterNewProjectLocationPrompt, moveProjectPrompt } from '../prompts/project';
import { RushConstants } from '@rushstack/rush-sdk';
import { addProjectToRushConfiguration, removeProjectFromRushConfiguration } from './updateRushConfiguration';
import {
  getRushSubspacesConfigurationJsonPath,
  isExternalMonorepo,
  loadRushSubspacesConfiguration
} from '../utilities/repository';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { queryProjectsFromSubspace } from '../utilities/subspace';
import path from 'path';

const refreshSubspace = (subspaceName: string, rootPath: string): void => {
  const subspacesConfig: ISubspacesConfigurationJson = loadRushSubspacesConfiguration(rootPath);
  const newSubspaces: string[] = [...subspacesConfig.subspaceNames];
  if (queryProjectsFromSubspace(subspaceName, rootPath).length === 0) {
    newSubspaces.splice(newSubspaces.indexOf(subspaceName), 1);
  }

  subspacesConfig.subspaceNames = newSubspaces;

  JsonFile.save(subspacesConfig, getRushSubspacesConfigurationJsonPath(rootPath));
};

const moveProjectToSubspaceFolder = async (
  sourceProjectFolderPath: string,
  targetSubspace: string,
  rootPath: string
): Promise<string | undefined> => {
  const targetSubspaceFolderPath: string = `${rootPath}/${RushNameConstants.SubspacesFolderName}/${targetSubspace}`;

  const targetProjectFolderPath: string = await enterNewProjectLocationPrompt(
    sourceProjectFolderPath,
    targetSubspaceFolderPath
  );

  Console.debug(
    `Moving project from ${Colorize.bold(sourceProjectFolderPath)} to ${Colorize.bold(
      targetProjectFolderPath
    )}...`
  );

  if (!FileSystem.exists(sourceProjectFolderPath)) {
    Console.error(
      `The path ${Colorize.bold(
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

  return targetProjectFolderPath;
};

export const addProjectToSubspace = async (
  sourceProject: IRushConfigurationProjectJson,
  targetSubspace: string,
  sourceMonorepoPath: string,
  targetMonorepoPath: string
): Promise<void> => {
  Console.debug(
    `Adding source project ${Colorize.bold(sourceProject.packageName)} to target subspace ${Colorize.bold(
      targetSubspace
    )}...`
  );

  let targetProjectFolderPath: string | undefined = `${targetMonorepoPath}/${sourceProject.projectFolder}`;
  if (isExternalMonorepo(sourceMonorepoPath, targetMonorepoPath) || (await moveProjectPrompt())) {
    const sourceProjectFolderPath: string = `${sourceMonorepoPath}/${sourceProject.projectFolder}`;
    targetProjectFolderPath = await moveProjectToSubspaceFolder(
      sourceProjectFolderPath,
      targetSubspace,
      targetMonorepoPath
    );
    if (!targetProjectFolderPath) {
      return;
    }

    if (FileSystem.exists(`${targetMonorepoPath}/${RushNameConstants.EdenMonorepoFileName}`)) {
      await updateEdenProject(
        sourceProject,
        path.relative(sourceMonorepoPath, targetProjectFolderPath),
        targetMonorepoPath
      );
    }
  }

  const targetLegacySubspaceFolderPath: string = `${targetProjectFolderPath}/subspace`;
  if (FileSystem.exists(targetLegacySubspaceFolderPath)) {
    Console.debug(`Removing legacy subspace folder ${Colorize.bold(targetLegacySubspaceFolderPath)}...`);
    FileSystem.deleteFolder(targetLegacySubspaceFolderPath);
  }

  addProjectToRushConfiguration(sourceProject, targetSubspace, targetProjectFolderPath, targetMonorepoPath);
  removeProjectFromRushConfiguration(sourceProject, sourceMonorepoPath);
  if (sourceProject.subspaceName) {
    refreshSubspace(sourceProject.subspaceName, sourceMonorepoPath);
  }

  Console.success(
    `Source project ${Colorize.bold(
      sourceProject.packageName
    )} has been successfully added to target subspace ${Colorize.bold(targetSubspace)}.`
  );
};
