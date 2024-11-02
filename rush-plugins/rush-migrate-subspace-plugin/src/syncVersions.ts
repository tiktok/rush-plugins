import { chooseSubspacePrompt } from './prompts/subspace';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import Console from './providers/console';
import { Colorize } from '@rushstack/terminal';
import { queryProjectsFromSubspace, querySubspaces } from './utilities/repository';
import { getRootPath } from './utilities/path';
import { getSubspaceMismatches } from './utilities/subspace';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { chooseProjectPrompt } from './prompts/project';
import { syncProjectMismatchedDependencies } from './functions/syncProjectDependencies';

const syncSubspaceMismatchedDependencies = async (
  subspaceName: string,
  mismatchedProjects: string[]
): Promise<boolean> => {
  const projects: IRushConfigurationProjectJson[] = queryProjectsFromSubspace(subspaceName);

  do {
    const selectedProjectName: string = await chooseProjectPrompt(mismatchedProjects);
    const selectedProjectIndex: number = projects.findIndex(
      ({ packageName }) => packageName === selectedProjectName
    );

    await syncProjectMismatchedDependencies(selectedProjectName, true);
    projects.splice(selectedProjectIndex, 1);
  } while (projects.length > 0);

  return projects.length === 0;
};

export const syncVersions = async (): Promise<void> => {
  Console.debug('Executing project version synchronization command...');

  const sourceSubspaces: string[] = querySubspaces();
  if (sourceSubspaces.length === 0) {
    Console.error(`No subspaces found in the monorepo ${Colorize.bold(getRootPath())}! Exiting...`);
    return;
  }

  const selectedSubspaceName: string = await chooseSubspacePrompt(sourceSubspaces);
  const subspaceMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getSubspaceMismatches(selectedSubspaceName);

  Console.title(`🔄 Syncing version mismatches for subspace ${Colorize.bold(selectedSubspaceName)}...`);

  if (subspaceMismatches.size === 0) {
    Console.success(`No mismatches found in the subspace ${Colorize.bold(selectedSubspaceName)}! Exiting...`);
    return;
  }

  const mismatchedProjects: string[] = [];
  for (const [, versions] of subspaceMismatches) {
    for (const [, entities] of versions) {
      mismatchedProjects.push(
        ...entities
          .filter(({ friendlyName }) => !mismatchedProjects.includes(friendlyName))
          .map(({ friendlyName }) => friendlyName)
      );
    }
  }

  Console.warn(`There are ${Colorize.bold(`${mismatchedProjects.length}`)} mismatched projects...`);
  if (await syncSubspaceMismatchedDependencies(selectedSubspaceName, mismatchedProjects)) {
    Console.success(
      `All mismatched projects for subspace ${Colorize.bold(
        selectedSubspaceName
      )} have been successfully synchronized!`
    );
  }
};
