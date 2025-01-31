import { chooseSubspacePrompt } from './prompts/subspace';
import { addProjectToSubspace } from './functions/addProjectToSubspace';
import { chooseProjectPrompt, confirmNextProjectToAddPrompt } from './prompts/project';
import Console from './providers/console';
import { Colorize } from '@rushstack/terminal';
import { updateSubspace } from './functions/updateSubspace';
import { getRushSubspaceConfigurationFolderPath, isSubspaceSupported } from './utilities/subspace';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { queryProjects } from './utilities/project';
import {
  getRushSubspacesConfigurationJsonPath,
  isExternalMonorepo,
  querySubspaces
} from './utilities/repository';
import { RushConstants } from '@rushstack/rush-sdk';
import { syncProjectMismatchedDependencies } from './functions/syncProjectDependencies';
import { chooseRepositoryPrompt } from './prompts/repository';

export const migrateProject = async (targetMonorepoPath: string): Promise<void> => {
  Console.debug('Executing project migration command...');

  Console.title(`🔍 Analyzing if monorepo ${Colorize.underline(targetMonorepoPath)} supports subspaces...`);

  const targetSubspaces: string[] = querySubspaces(targetMonorepoPath);
  if (!isSubspaceSupported(targetMonorepoPath) || targetSubspaces.length === 0) {
    Console.error(
      `The monorepo ${Colorize.bold(
        targetMonorepoPath
      )} doesn't support subspaces! Make sure you have ${Colorize.bold(
        getRushSubspacesConfigurationJsonPath(targetMonorepoPath)
      )} with the ${Colorize.bold(RushConstants.defaultSubspaceName)} subspace. Exiting...`
    );
    return;
  }

  Console.success(`Monorepo ${Colorize.bold(targetMonorepoPath)} fully supports subspaces!`);

  Console.title(`🔍 Finding projects to migrate to ${Colorize.bold(targetMonorepoPath)}...`);

  const sourceMonorepoPath: string = await chooseRepositoryPrompt();
  Console.warn(
    `The script will migrate from ${Colorize.bold(sourceMonorepoPath)} to ${Colorize.bold(
      targetMonorepoPath
    )}`
  );

  const targetSubspace: string = await chooseSubspacePrompt(targetSubspaces);

  // Loop until user asks to quit
  do {
    const sourceProjects: IRushConfigurationProjectJson[] = queryProjects(sourceMonorepoPath);
    const sourceAvailableProjects: IRushConfigurationProjectJson[] = isExternalMonorepo(
      sourceMonorepoPath,
      targetMonorepoPath
    )
      ? sourceProjects
      : sourceProjects.filter(({ subspaceName }) => subspaceName !== targetSubspace);

    if (sourceAvailableProjects.length === 0) {
      Console.error(
        `No available projects found in the monorepo ${Colorize.bold(sourceMonorepoPath)}! Exiting...`
      );
      return;
    }

    const sourceProjectNameToMigrate: string = await chooseProjectPrompt(
      sourceAvailableProjects.map(({ packageName }) => packageName)
    );
    const sourceProjectToMigrate: IRushConfigurationProjectJson | undefined = sourceAvailableProjects.find(
      ({ packageName }) => packageName === sourceProjectNameToMigrate
    );
    if (!sourceProjectToMigrate) {
      return;
    }

    Console.title(
      `🏃 Migrating source project ${sourceProjectToMigrate.packageName} to target subspace ${targetSubspace}...`
    );

    if (sourceProjectToMigrate.subspaceName) {
      const sourceSubspaceConfigurationFolderPath: string = getRushSubspaceConfigurationFolderPath(
        sourceProjectToMigrate.subspaceName,
        sourceMonorepoPath,
        sourceProjectToMigrate.projectFolder
      );

      await updateSubspace(targetSubspace, sourceSubspaceConfigurationFolderPath, targetMonorepoPath);
    }

    await addProjectToSubspace(
      sourceProjectToMigrate,
      targetSubspace,
      sourceMonorepoPath,
      targetMonorepoPath
    );
    await syncProjectMismatchedDependencies(sourceProjectToMigrate.packageName, targetMonorepoPath);
  } while (await confirmNextProjectToAddPrompt(targetSubspace));

  Console.warn(
    'Make sure to test thoroughly after updating the lockfile, there may be changes in the dependency versions.'
  );
};
