import { JsonFile, JsonObject } from '@rushstack/node-core-library';
import { RushNameConstants } from '../constants/paths';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';

export async function updateEdenProject(
  sourceProject: IRushConfigurationProjectJson,
  targetProjectFolderPath: string,
  rootPath: string
): Promise<void> {
  Console.debug(`Update monorepo eden configuration on ${Colorize.bold(rootPath)}...`);

  const edenPipelineFilePath: string = `${rootPath}/${RushNameConstants.EdenPipelineFileName}`;
  const edenPipelineJson: JsonObject = JsonFile.load(edenPipelineFilePath);
  for (const entry of Object.values<JsonObject>(edenPipelineJson.scene.scm)) {
    if (entry.pipelinePath?.includes(sourceProject.projectFolder)) {
      entry.pipelinePath = entry.pipelinePath.replace(sourceProject.projectFolder, targetProjectFolderPath);

      Console.debug(
        `Updating ${Colorize.bold(edenPipelineFilePath)}, by adding ${Colorize.bold(
          sourceProject.packageName
        )} into pipeline path...`
      );
      JsonFile.save(edenPipelineJson, edenPipelineFilePath, {
        updateExistingFile: true
      });

      Console.success('Eden monorepo pipelines have been successfully updated.');
    }
  }

  const edenMonorepoFilePath: string = `${rootPath}/${RushNameConstants.EdenMonorepoFileName}`;
  const edenMonorepoJson: JsonObject = JsonFile.load(edenMonorepoFilePath);
  const edenProject: JsonObject = edenMonorepoJson.packages.find(
    ({ name }: JsonObject) => name === sourceProject.packageName
  );

  if (edenProject) {
    edenProject.path = targetProjectFolderPath;

    Console.debug(
      `Updating ${Colorize.bold(edenMonorepoFilePath)}, by adding ${Colorize.bold(
        sourceProject.packageName
      )} into package path...`
    );

    JsonFile.save(edenMonorepoJson, edenMonorepoFilePath, {
      updateExistingFile: true
    });

    Console.success('Eden monorepo configuration has been successfully updated.');
  }
}
