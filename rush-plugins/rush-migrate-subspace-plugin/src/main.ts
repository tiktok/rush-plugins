import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import chalk from 'chalk';
import { JsonFile } from '@rushstack/node-core-library';
import { chooseSubspace, createSubspace, enterSubspaceSelection } from './commands/subspace';
import { addProjectToSubspace } from './functions/addProjectToSubspace';
import { getProject, queryProjects } from './utilities/project';
import { generateReport } from './functions/generateReport';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { RushPathConstants } from './constants/paths';
import { startSubspaces } from './functions/startSubspaces';
import { isSubspaceSupported } from './utilities/subspace';
import { chooseProject, confirmChooseProject } from './commands/project';

inquirer.registerPrompt('search-list', inquirerSearchList);

interface IRunOptions {
  report?: boolean;
}

export async function main(options: IRunOptions): Promise<void> {
  if (!isSubspaceSupported()) {
    // Start subspaces
    console.log(chalk.yellow(`The monorepo doesn't contain subspaces. Starting subspaces...`));
    await startSubspaces();
  }

  const availableProjects: IRushConfigurationProjectJson[] = queryProjects().filter(
    ({ subspaceName }) => !subspaceName
  );
  if (availableProjects.length === 0) {
    console.log(chalk.green('Congratulations! All projects are already assigned to a subspace!'));
    return;
  }

  const subspaceSelection: string = await enterSubspaceSelection();
  const subspaceJson: ISubspacesConfigurationJson = JsonFile.load(
    RushPathConstants.SubspacesConfigurationJson
  );

  const rushJson: IRushConfigurationJson = JsonFile.load(RushPathConstants.RushConfigurationJson);
  let chooseSubspaceFn: () => Promise<string>;
  if (subspaceSelection === 'new') {
    chooseSubspaceFn = async (): Promise<string> => {
      let targetSubspaceName: string = '';
      while (!targetSubspaceName) {
        const subspaceNameInput: string = await createSubspace();
        if (subspaceJson.subspaceNames.includes(subspaceNameInput)) {
          console.log(
            chalk.red(`The subspace ${subspaceNameInput} already exists. Please enter a new subspace name.`)
          );
        } else {
          targetSubspaceName = subspaceNameInput;
        }
      }

      return targetSubspaceName;
    };
  } else {
    chooseSubspaceFn = chooseSubspace;
  }

  const subspaceName: string = await chooseSubspaceFn();
  console.log('Adding to subspace: ', subspaceName);

  // Loop until user asks to quit
  let continueToAdd: boolean = true;
  do {
    const projectNameToAdd: string = await chooseProject(availableProjects, subspaceName);

    // Update rushJson for this project
    const projectToUpdate: IRushConfigurationProjectJson = getProject(projectNameToAdd);

    await addProjectToSubspace(
      projectToUpdate,
      subspaceName,
      rushJson,
      subspaceJson,
      subspaceSelection === 'new'
    );

    const selectAnotherProject: boolean = await confirmChooseProject(subspaceName);
    continueToAdd = selectAnotherProject;
  } while (continueToAdd);

  console.log(
    chalk.yellow(
      `Make sure to test thoroughly after updating the lockfile, there may be changes in the dependency versions.`
    )
  );

  if (options.report) {
    const subspaceName: string = await chooseSubspace();
    await generateReport(subspaceName);
  }
}
