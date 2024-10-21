import chalk from 'chalk';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { JsonFile, JsonObject } from '@rushstack/node-core-library';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { RushPathConstants } from '../constants/paths';

export async function updateEdenProject(
  projectToUpdate: IRushConfigurationProjectJson,
  subspaceName: string,
  rushJson: IRushConfigurationJson,
  newProjectFolder: string
): Promise<void> {
  const edenPipelineJson: JsonObject = JsonFile.load(RushPathConstants.EdenPipelineJson);

  for (const entry of Object.values<JsonObject>(edenPipelineJson.scene.scm)) {
    if (entry.entries[0] === projectToUpdate.packageName && entry.pipelinePath) {
      // Update the pipelinePath
      entry.pipelinePath = entry.pipelinePath.replace(projectToUpdate.projectFolder, newProjectFolder);

      JsonFile.save(edenPipelineJson, RushPathConstants.EdenPipelineJson, {
        updateExistingFile: true
      });

      console.log(chalk.green('Eden monorepo pipelines have been successfully updated.'));
    }
  }

  const edenMonorepoJson: JsonObject = JsonFile.load(RushPathConstants.EdenMonorepoJson);
  const edenProject: JsonObject = edenMonorepoJson.packages.filter(
    (pkg: JsonObject) => pkg.name === projectToUpdate.packageName
  )[0];

  if (edenProject) {
    // Update the project's entry in eden.monorepo.json
    edenProject.path = newProjectFolder;
    JsonFile.save(edenMonorepoJson, RushPathConstants.EdenMonorepoJson, {
      updateExistingFile: true
    });

    console.log(chalk.green('Eden monorepo configuration has been successfully updated.'));
  }
}