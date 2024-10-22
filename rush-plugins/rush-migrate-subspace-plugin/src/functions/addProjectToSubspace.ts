import chalk from 'chalk';
import fs from 'fs';
import { JsonFile, FileSystem } from '@rushstack/node-core-library';
import { getRootPath } from '../utilities/path';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { CommonVersionsConfiguration } from '@rushstack/rush-sdk/lib/api/CommonVersionsConfiguration';
import { updateEdenProject } from './updateEdenProject';
import { RushPathConstants } from '../constants/paths';
import { startSubspace } from './startSubspace';
import { enterNewProjectLocation, moveProject } from '../commands/project';

export const addProjectToSubspace = async (
  projectToUpdate: IRushConfigurationProjectJson,
  subspaceName: string,
  rushJson: IRushConfigurationJson,
  subspaceJson: ISubspacesConfigurationJson,
  isNewSubspace: boolean
): Promise<void> => {
  const canMoveProject: boolean = await moveProject();

  let newProjectFolder: string;
  let newProjectRelativeFolder: string;
  if (canMoveProject) {
    // Create the subspace folder
    const subspaceFolder: string = `${RushPathConstants.SubspacesFolder}/${subspaceName}`;
    FileSystem.ensureFolder(subspaceFolder);

    const newProjectFolderPath: string = await enterNewProjectLocation(projectToUpdate, subspaceName);

    // Move the project over
    newProjectFolder = `${subspaceFolder}/${newProjectFolderPath}`;
    newProjectRelativeFolder = `subspaces/${subspaceName}/${newProjectFolderPath}`;
    FileSystem.move({
      sourcePath: `${getRootPath()}/${projectToUpdate.projectFolder}`,
      destinationPath: newProjectFolder
    });
  } else {
    newProjectFolder = `${getRootPath()}/${projectToUpdate.projectFolder}`;
    newProjectRelativeFolder = projectToUpdate.projectFolder;
  }

  // Create the subspace config folder
  const subspaceConfigFolder: string = `${RushPathConstants.SubspacesConfigurationFolder}/${subspaceName}`;
  FileSystem.ensureFolder(subspaceConfigFolder);

  // Check if the project is already in a subspace
  if (!projectToUpdate.subspaceName) {
    // Create the necessary files if they don't exist
    await startSubspace(subspaceName);
  } else {
    // Project is in a individual subspace
    const projectSubspaceConfigFolder: string = `${newProjectFolder}/subspace/${projectToUpdate.subspaceName}`;
    // Update the subspace's npmrc file
    console.log(chalk.green('Migrating the .npmrc file...'));
    FileSystem.ensureFolder(`${newProjectFolder}/subspace/${projectToUpdate.subspaceName}`);

    const npmrcLines: string[] = [];
    if (FileSystem.exists(`${subspaceConfigFolder}/.npmrc`)) {
      npmrcLines.push(...fs.readFileSync(`${subspaceConfigFolder}/.npmrc`).toString().split('\n'));
    }

    if (FileSystem.exists(`${projectSubspaceConfigFolder}/.npmrc`)) {
      npmrcLines.push(...fs.readFileSync(`${projectSubspaceConfigFolder}/.npmrc`).toString().split('\n'));
    }

    FileSystem.writeFile(`${projectSubspaceConfigFolder}/.npmrc`, npmrcLines.join('\n'));

    // Join the common-versions.json
    if (FileSystem.exists(`${subspaceConfigFolder}/common-versions.json`)) {
      console.log(chalk.green('Merging the common-versions.file...'));
      // Merge the two common versions
      const subspaceCommonVersions: CommonVersionsConfiguration = JsonFile.load(
        `${subspaceConfigFolder}/common-versions.json`
      );

      const projectCommonVersions: CommonVersionsConfiguration = JsonFile.load(
        `${projectSubspaceConfigFolder}/common-versions.json`
      );

      for (const [key, value] of Object.entries(projectCommonVersions.preferredVersions)) {
        const subspacePreferredVersion: string | undefined =
          subspaceCommonVersions.preferredVersions.get(key);
        if (subspacePreferredVersion) {
          console.log(
            chalk.red(
              `There are conflicting values for ${key} in the common-versions.json file's preferredVersions: ${value} and ${subspacePreferredVersion}`
            )
          );
        } else {
          subspaceCommonVersions.preferredVersions.set(key, value);
        }
      }

      for (const [key, value] of Object.entries(projectCommonVersions.allowedAlternativeVersions)) {
        const subspaceAllowedAlternativeVersions: readonly string[] =
          subspaceCommonVersions.allowedAlternativeVersions.get(key) || [];
        if (subspaceAllowedAlternativeVersions.length > 0) {
          subspaceCommonVersions.allowedAlternativeVersions.set(key, [
            ...subspaceAllowedAlternativeVersions,
            value
          ]);
        } else {
          subspaceCommonVersions.allowedAlternativeVersions.set(key, value);
        }
      }

      JsonFile.save(subspaceCommonVersions, `${subspaceConfigFolder}/common-versions.json`, {
        updateExistingFile: true
      });
    } else {
      console.log(chalk.green('Migrating the common-versions.file...'));
      // directly copy
      FileSystem.copyFile({
        sourcePath: `${projectSubspaceConfigFolder}/common-versions.json`,
        destinationPath: `${subspaceConfigFolder}/common-versions.json`
      });
    }

    // Add any non-existent files
    if (!FileSystem.exists(`${subspaceConfigFolder}/repo-state.json`)) {
      console.log(chalk.green('Migrating the repo-state.json file...'));
      FileSystem.copyFile({
        sourcePath: `${projectSubspaceConfigFolder}/repo-state.json`,
        destinationPath: `${subspaceConfigFolder}/repo-state.json`
      });
    }

    // Add the pnpmfile over if it exists
    if (FileSystem.exists(`${projectSubspaceConfigFolder}/.pnpmfile-subspace.cjs`)) {
      console.log(chalk.green('Migrating the pnpmfile-subspace.cjs file...'));
      if (FileSystem.exists(`${subspaceConfigFolder}/.pnpmfile-subspace.cjs`)) {
        // It already exists, we need to copy it into a temp file name
        FileSystem.copyFile({
          sourcePath: `${projectSubspaceConfigFolder}/.pnpmfile-subspace.cjs`,
          destinationPath: `${subspaceConfigFolder}/.pnpmfile-subspace-copy.cjs`
        });
        console.log(
          chalk.yellow(
            `Note that there are now two .pnpmfile-subspaces.cjs. (.pnpmfile-subspaces.cjs and .pnpmfile-subspaces-copy.cjs). Please reconcile them into a singular .pnpmfile-subspaces.cjs manually.`
          )
        );
      } else {
        FileSystem.copyFile({
          sourcePath: `${projectSubspaceConfigFolder}/.pnpmfile-subspace.cjs`,
          destinationPath: `${subspaceConfigFolder}/.pnpmfile-subspace.cjs`
        });
      }
    }

    FileSystem.deleteFolder(`${newProjectFolder}/subspace`);
  }

  // Find the project in rushJson
  const rushProjectToUpdate: IRushConfigurationProjectJson = rushJson.projects.filter(
    (pkg) => pkg.packageName === projectToUpdate.packageName
  )[0];
  rushProjectToUpdate.projectFolder = newProjectRelativeFolder;
  rushProjectToUpdate.subspaceName = subspaceName;
  JsonFile.save(rushJson, RushPathConstants.RushConfigurationJson, {
    updateExistingFile: true
  });

  if (isNewSubspace && !subspaceJson.subspaceNames.includes(subspaceName)) {
    subspaceJson.subspaceNames.push(subspaceName);
  }

  JsonFile.save(subspaceJson, RushPathConstants.SubspacesConfigurationJson, {
    updateExistingFile: true
  });

  if (FileSystem.exists(RushPathConstants.EdenMonorepoJson)) {
    // Update the project's entry in eden
    await updateEdenProject(projectToUpdate, subspaceName, rushJson, newProjectRelativeFolder);
  }
};
