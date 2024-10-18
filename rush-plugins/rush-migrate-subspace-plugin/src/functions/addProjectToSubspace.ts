import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import { JsonFile, FileSystem } from '@rushstack/node-core-library';
import { RootPath } from './getRootPath';

export const addProjectToSubspace = async (
  projectToUpdate: any,
  subspaceName: string,
  rushJson: any,
  subspaceJson: any,
  isNewSubspace: boolean
) => {
  const { moveProject } = await inquirer.prompt([
    {
      message: `Do you want to move this project's location?`,
      type: 'confirm',
      name: 'moveProject'
    }
  ]);

  let newProjectFolder;
  let newProjectRelativeFolder;
  if (moveProject) {
    // Create the subspace folder
    const subspaceFolder = `${RootPath}/subspaces/${subspaceName}`;
    FileSystem.ensureFolder(subspaceFolder);

    const { folder } = await inquirer.prompt([
      {
        message: `Please enter the folder (or subfolder) you want to move this project to. \n${subspaceFolder}/<your_project_folder>`,
        type: 'input',
        name: 'folder',
        default: path.basename(projectToUpdate.projectFolder)
      }
    ]);

    // Move the project over
    newProjectFolder = `${subspaceFolder}/${folder}`;
    newProjectRelativeFolder = `subspaces/${subspaceName}/${folder}`;
    FileSystem.move({
      sourcePath: `${RootPath}/${projectToUpdate.projectFolder}`,
      destinationPath: newProjectFolder
    });
  } else {
    newProjectFolder = `${RootPath}/${projectToUpdate.projectFolder}`;
    newProjectRelativeFolder = projectToUpdate.projectFolder;
  }

  // Create the subspace config folder
  const subspaceConfigFolder = `${RootPath}/common/config/subspaces/${subspaceName}`;
  FileSystem.ensureFolder(subspaceConfigFolder);

  // Check if the project is already in a subspace that isn't a "split_*" workspace
  if (!projectToUpdate.subspaceName || !projectToUpdate.subspaceName.startsWith('split_')) {
    // Project already exists in a subspace

    // Create the necessary files if they dont exist
    const files = ['.npmrc', 'common-versions.json', 'repo-state.json'];
    for (const file of files) {
      if (!FileSystem.exists(`${subspaceConfigFolder}/${file}`)) {
        FileSystem.copyFile({
          sourcePath: `${RootPath}/common/autoinstallers/migrate-subspace/src/templates/${file}`,
          destinationPath: `${subspaceConfigFolder}/${file}`
        });
      }
    }
    console.log(
      chalk.yellow(
        `You are moving a project from the ${
          projectToUpdate.subspaceName || 'default'
        } subspace to the ${subspaceName} subspace. Please consider the following files and merge them if necessary: \n${files.join(
          '\n'
        )}`
      )
    );
    if (!projectToUpdate.subspaceName?.startsWith('split_')) {
      console.log(
        chalk.green(
          `Please run "rush update --subspace ${
            projectToUpdate.subspaceName || 'default'
          }" to update the subspace that this project is migrating from.`
        )
      );
    }
  } else {
    // Project is in a individual subspace
    const projectSubspaceConfigFolder = `${newProjectFolder}/subspace/${projectToUpdate.subspaceName}`;
    // Update the subspace's npmrc file
    console.log(chalk.green('Migrating the .npmrc file...'));
    const npmrcLines = [];
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
      const subspaceCommonVersions = JsonFile.load(`${subspaceConfigFolder}/common-versions.json`);
      const projectCommonVersions = JsonFile.load(`${projectSubspaceConfigFolder}/common-versions.json`);
      for (const [key, value] of Object.entries(projectCommonVersions.preferredVersions)) {
        if (subspaceCommonVersions.preferredVersions[key]) {
          console.log(
            chalk.red(
              `There are conflicting values for ${key} in the common-versions.json file's prefferedVersions: ${value} and ${subspaceCommonVersions.preferredVersions[key]}`
            )
          );
        } else {
          subspaceCommonVersions.preferredVersions[key] = value;
        }
      }
      for (const [key, value] of Object.entries(projectCommonVersions.allowedAlternativeVersions)) {
        if (subspaceCommonVersions.allowedAlternativeVersions[key]) {
          // @ts-ignore
          subspaceCommonVersions.allowedAlternativeVersions[key].push(...value);
        } else {
          subspaceCommonVersions.allowedAlternativeVersions[key] = value;
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

    // Add any non-existant files
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

    // Delete the project's subspace/split_* folder
    FileSystem.deleteFolder(`${newProjectFolder}/subspace`);
  }

  // Try to update the entry in eden.mono.pipeline.json as well
  const edenPipelineJson = JsonFile.load(`${RootPath}/eden.mono.pipeline.json`);
  let pipelineEntry: any;
  for (const entry of Object.values(edenPipelineJson.scene.scm)) {
    // @ts-ignore
    if (entry.entries[0] === projectToUpdate.packageName) {
      pipelineEntry = entry;
    }
  }
  // Update the pipelinePath if it exit
  if (pipelineEntry && pipelineEntry.pipelinePath) {
    // replace the pipeline path
    pipelineEntry.pipelinePath = pipelineEntry.pipelinePath.replace(
      projectToUpdate.projectFolder,
      newProjectRelativeFolder
    );
    JsonFile.save(edenPipelineJson, `${RootPath}/eden.mono.pipeline.json`, {
      updateExistingFile: true
    });
  }

  const previousSubspaceName = projectToUpdate.subspaceName || 'default';
  // Find the project in rushJson
  const rushProjectToUpdate = rushJson.projects.filter(
    (pkg: any) => pkg.packageName === projectToUpdate.packageName
  )[0];
  rushProjectToUpdate.projectFolder = newProjectRelativeFolder;
  rushProjectToUpdate.subspaceName = subspaceName;
  JsonFile.save(rushJson, `${RootPath}/rush.json`, {
    updateExistingFile: true
  });

  // Update the project's entry in eden.monorepo.json
  const edenMonorepoJson = JsonFile.load(`${RootPath}/eden.monorepo.json`);
  const edenProject = edenMonorepoJson.packages.filter(
    (pkg: any) => pkg.name === projectToUpdate.packageName
  )[0];
  if (edenProject) {
    edenProject.path = newProjectRelativeFolder;
    JsonFile.save(edenMonorepoJson, `${RootPath}/eden.monorepo.json`, {
      updateExistingFile: true
    });
  }

  // Update the subspace json
  if (previousSubspaceName.startsWith('split_')) {
    subspaceJson.subspaceNames = subspaceJson.subspaceNames.filter(
      (subspaceName: string) => subspaceName !== previousSubspaceName
    );
  }
  if (isNewSubspace && !subspaceJson.subspaceNames.includes(subspaceName)) {
    subspaceJson.subspaceNames.push(subspaceName);
  }
  JsonFile.save(subspaceJson, `${RootPath}/common/config/rush/subspaces.json`, {
    updateExistingFile: true
  });
};
