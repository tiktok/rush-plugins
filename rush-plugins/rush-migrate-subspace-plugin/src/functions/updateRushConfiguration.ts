import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getRootPath } from '../utilities/path';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { loadRushConfiguration } from '../utilities/repository';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { JsonFile } from '@rushstack/node-core-library';
import { RushConstants } from '@rushstack/rush-sdk';
import path from 'path';

export const removeProjectFromRushConfiguration = (
  project: IRushConfigurationProjectJson,
  monoRepoRootPath: string = getRootPath()
): void => {
  const rushConfigFile: string = `${monoRepoRootPath}/${RushConstants.rushJsonFilename}`;
  const rushConfig: IRushConfigurationJson = loadRushConfiguration(monoRepoRootPath);
  const projectIndex: number = rushConfig.projects.findIndex(
    ({ packageName }) => packageName === project.packageName
  );

  if (projectIndex < 0) {
    Console.error(
      `The project ${Colorize.bold(project.packageName)} wasn't found in ${RushConstants.rushJsonFilename}!`
    );
    return;
  }

  Console.debug(
    `Updating ${Colorize.bold(rushConfigFile)} by removing ${Colorize.bold(project.packageName)}...`
  );

  const newProjects: IRushConfigurationProjectJson[] = [...rushConfig.projects];
  newProjects.splice(projectIndex, 1);

  rushConfig.projects = [];
  JsonFile.save(rushConfig, rushConfigFile, {
    updateExistingFile: true
  });

  rushConfig.projects = newProjects;
  JsonFile.save(rushConfig, rushConfigFile, {
    updateExistingFile: true
  });
};

export const addProjectToRushConfiguration = (
  sourceProject: IRushConfigurationProjectJson,
  targetSubspace: string,
  targetProjectFolderPath: string,
  monoRepoRootPath: string = getRootPath()
): void => {
  const rushConfigFile: string = `${monoRepoRootPath}/${RushConstants.rushJsonFilename}`;
  const rushConfig: IRushConfigurationJson = loadRushConfiguration(monoRepoRootPath);
  const projectIndex: number = rushConfig.projects.findIndex(
    ({ packageName }) => packageName === sourceProject.packageName
  );
  let newTargetProject: IRushConfigurationProjectJson = {
    subspaceName: targetSubspace,
    packageName: sourceProject.packageName,
    projectFolder: path.relative(monoRepoRootPath, targetProjectFolderPath),
    decoupledLocalDependencies: []
  };

  if (projectIndex >= 0) {
    newTargetProject = {
      ...rushConfig.projects[projectIndex],
      ...newTargetProject,
      decoupledLocalDependencies: rushConfig.projects[projectIndex].decoupledLocalDependencies || []
    };

    rushConfig.projects[projectIndex] = newTargetProject;
  } else {
    rushConfig.projects.push(newTargetProject);
  }

  Console.debug(
    `Updating ${Colorize.bold(rushConfigFile)} by assigning ${Colorize.bold(
      sourceProject.packageName
    )} to ${Colorize.bold(targetSubspace)}...`
  );

  JsonFile.save(rushConfig, rushConfigFile, {
    updateExistingFile: true
  });
};
