import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getRootPath } from '../utilities/path';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { loadRushConfiguration } from '../utilities/repository';
import Console from '../providers/console';
import chalk from 'chalk';
import { JsonFile } from '@rushstack/node-core-library';
import { RushConstants } from '@rushstack/rush-sdk';

export const removeProjectToRushConfiguration = (
  targetProject: IRushConfigurationProjectJson,
  monoRepoRootPath: string = getRootPath()
): void => {
  const rushConfig: IRushConfigurationJson = loadRushConfiguration(monoRepoRootPath);
  const targetProjectIndex: number = rushConfig.projects.findIndex(
    ({ packageName }) => packageName === targetProject.packageName
  );
  if (targetProjectIndex < 0) {
    Console.error(
      `The project ${chalk.bold(targetProject.packageName)} wasn't found in ${
        RushConstants.rushJsonFilename
      }!`
    );
    return;
  }

  rushConfig.projects.splice(targetProjectIndex, 1);
  Console.debug(`Updating rush.json by removing ${chalk.bold(targetProject.packageName)}...`);

  JsonFile.save(rushConfig, RushConstants.rushJsonFilename, {
    updateExistingFile: true,
    prettyFormatting: true
  });
};

export const addProjectToRushConfiguration = (
  targetProject: IRushConfigurationProjectJson,
  targetSubspace: string,
  monoRepoRootPath: string = getRootPath()
): void => {
  const rushConfig: IRushConfigurationJson = loadRushConfiguration(monoRepoRootPath);
  const targetProjectIndex: number = rushConfig.projects.findIndex(
    ({ packageName }) => packageName === targetProject.packageName
  );
  let newTargetProject: IRushConfigurationProjectJson = {
    subspaceName: targetSubspace,
    packageName: targetProject.packageName,
    projectFolder: targetProject.projectFolder,
    decoupledLocalDependencies: []
  };

  if (targetProjectIndex >= 0) {
    newTargetProject = {
      ...rushConfig.projects[targetProjectIndex],
      ...newTargetProject,
      decoupledLocalDependencies: rushConfig.projects[targetProjectIndex].decoupledLocalDependencies
    };

    rushConfig.projects[targetProjectIndex] = newTargetProject;
  } else {
    rushConfig.projects.push(newTargetProject);
  }

  Console.debug(
    `Updating rush.json by assigning ${chalk.bold(targetProject.packageName)} to ${chalk.bold(
      targetSubspace
    )}...`
  );

  JsonFile.save(rushConfig, RushConstants.rushJsonFilename, {
    updateExistingFile: true,
    prettyFormatting: true
  });
};
