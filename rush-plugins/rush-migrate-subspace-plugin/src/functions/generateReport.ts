import { JsonFile, JsonObject } from '@rushstack/node-core-library';
import { enterReportFileLocationPrompt } from '../prompts/dependency';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { RushNameConstants } from '../constants/paths';
import { getProjectMismatches } from '../utilities/project';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { sortVersions } from '../utilities/dependency';

export const generateReport = async (projectName: string, rootPath: string): Promise<void> => {
  Console.debug(`Generating mismatches report for the project ${Colorize.bold(projectName)}...`);

  const projectMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getProjectMismatches(projectName, rootPath);
  if (projectMismatches.size === 0) {
    Console.success(`No mismatches found for the project ${Colorize.bold(projectName)}.`);
    return;
  }

  const output: JsonObject = {};
  const mismatchedDependencies: string[] = Array.from(projectMismatches.keys()).sort();
  for (const mismatchedDependency of mismatchedDependencies) {
    output[mismatchedDependency] = [];

    const mismatchedDependencyMap: ReadonlyMap<string, readonly VersionMismatchFinderEntity[]> | undefined =
      projectMismatches.get(mismatchedDependency);
    const mismatchedVersions: string[] = sortVersions(Array.from(mismatchedDependencyMap?.keys() || []));
    for (const mismatchedVersion of mismatchedVersions) {
      const mismatchedProjects: string[] = (
        mismatchedDependencyMap?.get(mismatchedVersion)?.map(({ friendlyName }) => friendlyName) || []
      ).sort();
      output[mismatchedDependency] = {
        ...output[mismatchedDependency],
        [mismatchedVersion]: mismatchedProjects
      };
    }
  }

  const reportFilePath: string = `${rootPath}/${projectName}_${RushNameConstants.AnalysisFileName}`;
  const jsonFilePath: string = await enterReportFileLocationPrompt(reportFilePath);
  JsonFile.save(output, jsonFilePath, { prettyFormatting: true });
  Console.success(`Saved report file to ${Colorize.bold(jsonFilePath)}.`);
};
