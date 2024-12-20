import { chooseSubspacePrompt } from './prompts/subspace';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import Console from './providers/console';
import { Colorize } from '@rushstack/terminal';
import { querySubspaces } from './utilities/repository';
import { getSubspaceMismatches } from './utilities/subspace';
import { chooseProjectPrompt, confirmNextProjectToSyncPrompt } from './prompts/project';
import { syncProjectMismatchedDependencies } from './functions/syncProjectDependencies';

const fetchSubspaceMismatchedProjects = (subspaceName: string, rootPath: string): string[] => {
  const mismatchedProjects: string[] = [];
  const subspaceMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getSubspaceMismatches(subspaceName, rootPath);

  for (const [, versions] of subspaceMismatches) {
    for (const [, entities] of versions) {
      mismatchedProjects.push(
        ...entities
          .filter(({ friendlyName }) => !mismatchedProjects.includes(friendlyName))
          .map(({ friendlyName }) => friendlyName)
      );
    }
  }

  if (mismatchedProjects.length > 0) {
    Console.warn(`There are ${Colorize.bold(`${mismatchedProjects.length}`)} mismatched projects...`);
  }

  return mismatchedProjects;
};

export const syncVersions = async (rootPath: string): Promise<void> => {
  Console.debug('Synching project version...');

  const sourceSubspaces: string[] = querySubspaces(rootPath);
  if (sourceSubspaces.length === 0) {
    Console.error(`No subspaces found in the monorepo ${Colorize.bold(rootPath)}! Exiting...`);
    return;
  }

  const selectedSubspaceName: string = await chooseSubspacePrompt(sourceSubspaces);
  Console.title(`🔄 Syncing version mismatches for subspace ${Colorize.bold(selectedSubspaceName)}...`);

  let mismatchedProjects: string[] = fetchSubspaceMismatchedProjects(selectedSubspaceName, rootPath);
  if (mismatchedProjects.length === 0) {
    Console.success(`No mismatches found in the subspace ${Colorize.bold(selectedSubspaceName)}! Exiting...`);
    return;
  }

  do {
    const selectedProjectName: string = await chooseProjectPrompt(mismatchedProjects);
    if (!(await syncProjectMismatchedDependencies(selectedProjectName, rootPath))) {
      return;
    }

    mismatchedProjects = fetchSubspaceMismatchedProjects(selectedSubspaceName, rootPath);
  } while (mismatchedProjects.length > 0 && (await confirmNextProjectToSyncPrompt(selectedSubspaceName)));

  if (mismatchedProjects.length === 0) {
    Console.success(
      `All mismatched projects for subspace ${Colorize.bold(
        selectedSubspaceName
      )} have been successfully synchronized!`
    );
  }
};
