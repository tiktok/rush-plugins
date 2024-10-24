import {
  chooseCreateOrSelectSubspacePrompt,
  chooseSubspacePrompt,
  createSubspacePrompt
} from './prompts/subspace';
import { addProjectToSubspace } from './functions/addProjectToSubspace';
import { initSubspaces } from './functions/initSubspaces';
import { chooseProjectPrompt, confirmNextProjectPrompt } from './prompts/project';
import { chooseRepositoryPrompt } from './prompts/repository';
import Console from './providers/console';
import { getRootPath } from './utilities/path';
import chalk from 'chalk';
import { createSubspace } from './functions/createSubspace';
import { updateSubspace } from './functions/updateSubspace';
import { getRushSubspaceConfigurationFolderPath, isSubspaceSupported } from './utilities/subspace';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { queryProjects } from './utilities/project';
import { isExternalMonorepo, querySubspaces } from './utilities/repository';

export async function migrateProject(): Promise<void> {
  Console.debug('Executing project migration command...');

  Console.title(`🔍 Analyzing if monorepo ${chalk.underline(getRootPath())} supports subspaces...`);

  const targetSubspaces: string[] = querySubspaces();
  if (!isSubspaceSupported()) {
    // Start subspaces
    Console.warn(
      `The monorepo ${chalk.bold(getRootPath())} doesn't contain subspaces. Initializing subspaces...`
    );
    await initSubspaces();
  }

  Console.success(`Monorepo ${chalk.bold(getRootPath())} fully supports subspaces!`);

  Console.title(`🔍 Finding projects to migrate to ${chalk.bold(getRootPath())}...`);
  const sourceMonorepoPath: string = await chooseRepositoryPrompt();

  Console.warn(
    `The script will migrate from ${chalk.bold(sourceMonorepoPath)} to ${chalk.bold(getRootPath())}`
  );

  const subspaceSelectionType: string = await chooseCreateOrSelectSubspacePrompt(targetSubspaces);

  const targetSubspace: string =
    subspaceSelectionType === 'new'
      ? await createSubspacePrompt(targetSubspaces)
      : await chooseSubspacePrompt(targetSubspaces);

  if (!targetSubspaces.includes(targetSubspace)) {
    await createSubspace(targetSubspace);
  }

  // Loop until user asks to quit
  do {
    const sourceProjects: IRushConfigurationProjectJson[] = queryProjects(sourceMonorepoPath);
    const sourceAvailableProjects: IRushConfigurationProjectJson[] = isExternalMonorepo(sourceMonorepoPath)
      ? sourceProjects
      : sourceProjects.filter(({ subspaceName }) => subspaceName !== targetSubspace);

    if (sourceAvailableProjects.length === 0) {
      Console.success(
        `No available projects found in the monorepo ${chalk.bold(sourceMonorepoPath)}! Exiting...`
      );
      return;
    }

    const sourceProjectToMigrate: IRushConfigurationProjectJson = await chooseProjectPrompt(
      sourceAvailableProjects
    );
    Console.title(
      `🏃 Migrating project ${sourceProjectToMigrate.packageName} to subspace ${chalk.bold(
        targetSubspace
      )}...`
    );

    if (sourceProjectToMigrate.subspaceName) {
      const sourceSubspaceConfigurationFolderPath: string = getRushSubspaceConfigurationFolderPath(
        sourceProjectToMigrate.subspaceName,
        sourceMonorepoPath,
        sourceProjectToMigrate.projectFolder
      );

      const targetSubspaceConfigurationFolderPath: string =
        getRushSubspaceConfigurationFolderPath(targetSubspace);

      await updateSubspace(sourceSubspaceConfigurationFolderPath, targetSubspaceConfigurationFolderPath);
    }

    await addProjectToSubspace(sourceProjectToMigrate, targetSubspace, sourceMonorepoPath);
  } while (await confirmNextProjectPrompt(targetSubspace));

  Console.warn(
    'Make sure to test thoroughly after updating the lockfile, there may be changes in the dependency versions.'
  );
}
