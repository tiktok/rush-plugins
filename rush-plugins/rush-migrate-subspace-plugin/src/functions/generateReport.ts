import { JsonFile, JsonObject } from '@rushstack/node-core-library';
import { enterReportFileLocationPrompt } from '../prompts/dependency';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { RushNameConstants } from '../constants/paths';
import { getProjectMismatches } from '../utilities/project';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { getRootPath } from '../utilities/path';

export const generateReport = async (projectName: string): Promise<void> => {
  Console.debug(`Generating mismatches report for the project ${Colorize.bold(projectName)}...`);

  const projectMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getProjectMismatches(projectName);
  if (projectMismatches.size === 0) {
    Console.success(`No mismatches found for the project ${Colorize.bold(projectName)}.`);
    return;
  }

  const output: JsonObject = {};
  for (const [mismatchedDependency, mismatchedVersions] of projectMismatches) {
    output[mismatchedDependency] = [];

    for (const [mismatchedVersion, mismatchedProjects] of mismatchedVersions) {
      output[mismatchedDependency] = {
        ...output[mismatchedDependency],
        [mismatchedVersion]: mismatchedProjects.map((project) => project.friendlyName)
      };
    }
  }

  const reportFilePath: string = `${getRootPath()}/${projectName}_${RushNameConstants.AnalysisFileName}`;
  const jsonFilePath: string = await enterReportFileLocationPrompt(reportFilePath);
  JsonFile.save(output, jsonFilePath, { prettyFormatting: true });
  Console.success(`Saved report file to ${Colorize.bold(jsonFilePath)}.`);
};
