import { chooseSubspacePrompt } from './prompts/subspace';
import { addProjectToSubspace } from './functions/addProjectToSubspace';
import { chooseProjectPrompt, confirmNextProjectPrompt } from './prompts/project';
import Console from './providers/console';
import { getRootPath } from './utilities/path';
import chalk from 'chalk';
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

export async function migrateProject(): Promise<void> {
  Console.debug('Executing project migration command...');

  Console.title(`🔍 Analyzing if monorepo ${chalk.underline(getRootPath())} supports subspaces...`);

  /**
   * WARN: Disabling auto subspace initialization for now.
   * if (!isSubspaceSupported()) {
   *     Console.warn(
   *  `The monorepo ${chalk.bold(getRootPath())} doesn't contain subspaces. Initializing subspaces...`
   *);
   * await initSubspaces();
   * }
   */

  const targetSubspaces: string[] = querySubspaces();
  if (!isSubspaceSupported() || targetSubspaces.length === 0) {
    Console.error(
      `The monorepo ${chalk.bold(getRootPath())} doesn't support subspaces! Make sure you have ${chalk.bold(
        getRushSubspacesConfigurationJsonPath()
      )} with the ${chalk.bold(RushConstants.defaultSubspaceName)} subspace. Exiting...`
    );
    return;
  }

  Console.success(`Monorepo ${chalk.bold(getRootPath())} fully supports subspaces!`);

  Console.title(`🔍 Finding projects to migrate to ${chalk.bold(getRootPath())}...`);

  /**
   * WARN: Disabling different repository selection for now.
   * const sourceMonorepoPath: string = await chooseRepositoryPrompt();
   * Console.warn(
   *   `The script will migrate from ${chalk.bold(sourceMonorepoPath)} to ${chalk.bold(getRootPath())}`
   * );
   */

  const sourceMonorepoPath: string = getRootPath();

  /**
   * WARN: Disabling creating new subspaces for now.
   *   const subspaceSelectionType: string = await chooseCreateOrSelectSubspacePrompt(targetSubspaces);
   *
   * const targetSubspace: string =
   *  subspaceSelectionType === 'new'
   *    ? await createSubspacePrompt(targetSubspaces)
   *    : await chooseSubspacePrompt(targetSubspaces);
   *
   * if (!targetSubspaces.includes(targetSubspace)) {
   *  await createSubspace(targetSubspace);
   *}
   */

  const targetSubspace: string = await chooseSubspacePrompt(targetSubspaces);

  // Loop until user asks to quit
  do {
    const sourceProjects: IRushConfigurationProjectJson[] = queryProjects(sourceMonorepoPath);
    const sourceAvailableProjects: IRushConfigurationProjectJson[] = isExternalMonorepo(sourceMonorepoPath)
      ? sourceProjects
      : sourceProjects.filter(({ subspaceName }) => subspaceName !== targetSubspace);

    if (sourceAvailableProjects.length === 0) {
      Console.error(
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
