import { chooseSubspacePrompt } from './prompts/subspace';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import Console from './providers/console';
import { Colorize } from '@rushstack/terminal';
import { querySubspaces } from './utilities/repository';
import { getRootPath } from './utilities/path';
import { syncDependencies } from './functions/syncDependencies';
import { getSubspaceMismatches } from './utilities/subspace';

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

  Console.warn(`There are ${Colorize.bold(`${subspaceMismatches.size}`)} mismatched dependencies...`);
  if (await syncDependencies(subspaceMismatches, selectedSubspaceName)) {
    Console.success('Version sync complete! Please test and validate all affected packages.');
  }
};
