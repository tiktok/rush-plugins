import { JsonFile, JsonObject } from '@rushstack/node-core-library';
import { RushNameConstants } from '../constants/paths';
import Console from '../providers/console';
import chalk from 'chalk';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getRootPath } from '../utilities/path';

export async function updateEdenProject(
  sourceProject: IRushConfigurationProjectJson,
  targetProject: IRushConfigurationProjectJson
): Promise<void> {
  Console.debug(`Update monorepo eden configuration...`);

  const edenPipelineFilePath: string = `${getRootPath()}/${RushNameConstants.EdenPipelineFileName}`;
  const edenPipelineJson: JsonObject = JsonFile.load(edenPipelineFilePath);
  for (const entry of Object.values<JsonObject>(edenPipelineJson.scene.scm)) {
    if (entry.entries[0] === targetProject.packageName && entry.pipelinePath) {
      // Update the pipelinePath
      entry.pipelinePath = entry.pipelinePath.replace(
        sourceProject.projectFolder,
        targetProject.projectFolder
      );

      Console.debug(
        `Updating eden.mono.pipeline.json, by adding ${chalk.bold(
          targetProject.packageName
        )} into pipeline path...`
      );
      JsonFile.save(edenPipelineJson, edenPipelineFilePath, {
        updateExistingFile: true
      });

      Console.success('Eden monorepo pipelines have been successfully updated.');
    }
  }

  const edenMonorepoFilePath: string = `${getRootPath()}/${RushNameConstants.EdenMonorepoFileName}`;
  const edenMonorepoJson: JsonObject = JsonFile.load(edenMonorepoFilePath);
  const edenProject: JsonObject = edenMonorepoJson.packages.filter(
    ({ name }: JsonObject) => name === targetProject.packageName
  )[0];

  if (edenProject) {
    edenProject.path = targetProject.projectFolder;

    Console.debug(
      `Updating eden.monorepo.json, by adding ${chalk.bold(targetProject.packageName)} into package path...`
    );

    JsonFile.save(edenMonorepoJson, edenMonorepoFilePath, {
      updateExistingFile: true
    });

    Console.success('Eden monorepo configuration has been successfully updated.');
  }
}
