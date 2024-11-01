import { getProjectMismatches, queryProject } from '../utilities/project';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { syncDependencies } from './syncDependencies';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';

export const syncProjectDependencies = async (projectName: string): Promise<boolean> => {
  Console.title(`🔄 Syncing version mismatches for project ${Colorize.bold(projectName)}...`);

  const projectMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getProjectMismatches(projectName);

  if (projectMismatches.size === 0) {
    Console.success(`No mismatches found in the project ${Colorize.bold(projectName)}!`);
    return true;
  }

  Console.warn(
    `There are ${Colorize.bold(
      `${projectMismatches.size}`
    )} mismatched dependencies for the project ${Colorize.bold(projectName)}...`
  );

  const project: IRushConfigurationProjectJson | undefined = queryProject(projectName);
  if (!project || !project.subspaceName) {
    Console.error(`Project ${Colorize.bold(projectName)} is not part of a subspace!`);
    return false;
  }

  return await syncDependencies(projectMismatches, project.subspaceName, project.packageName);
};
