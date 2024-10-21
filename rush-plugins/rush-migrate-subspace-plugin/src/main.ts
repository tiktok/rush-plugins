import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import chalk from 'chalk';
import { JsonFile } from '@rushstack/node-core-library';
import { querySubspace } from './functions/querySubspace';
import { addProjectToSubspace } from './functions/addProjectToSubspace';
import { getProject } from './utilities/project';
import { generateProjectReport } from './functions/generateProjectReport';
import { queryProject } from './functions/queryProject';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { ISubspacesConfigurationJson } from '@rushstack/rush-sdk/lib/api/SubspacesConfiguration';
import { RushPathConstants } from './constants/paths';
import { startSubspaces } from './functions/startSubspaces';
import { isSubspaceSupported } from './utilities/subspace';

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

  const { subspaceSelection } = await inquirer.prompt([
    {
      message:
        'Would you like to migrate a package to an existing subspace, or create a new subspace with this package?',
      name: 'subspaceSelection',
      type: 'list',
      choices: [
        {
          name: 'Select an existing subspace',
          value: 'existing'
        },
        {
          name: 'Create a new subspace',
          value: 'new'
        }
      ]
    }
  ]);

  const subspaceJson: ISubspacesConfigurationJson = JsonFile.load(
    RushPathConstants.SubspacesConfigurationJson
  );
  const rushJson: IRushConfigurationJson = JsonFile.load(RushPathConstants.RushConfigurationJson);
  let startSubspaceFn: () => Promise<string>;
  if (subspaceSelection === 'new') {
    startSubspaceFn = async (): Promise<string> => {
      let targetSubspaceName: string = '';
      while (!targetSubspaceName) {
        const { subspaceNameInput } = await inquirer.prompt([
          {
            message: 'Please enter a subspace name (lowercase letters with underscores (_) are allowed).',
            name: 'subspaceNameInput',
            type: 'input'
          }
        ]);

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
    startSubspaceFn = querySubspace;
  }

  const subspaceName: string = await startSubspaceFn();
  console.log('Adding to subspace: ', subspaceName);

  // Loop until user asks to quit
  let continueToAdd: boolean = true;
  do {
    const projectNameToAdd: string = await queryProject(
      `Please select a project to add to the ${subspaceName} subspace.`,
      (project) => !project.subspaceName
    );

    // Update rushJson for this project
    const projectToUpdate: IRushConfigurationProjectJson = getProject(projectNameToAdd);

    await addProjectToSubspace(
      projectToUpdate,
      subspaceName,
      rushJson,
      subspaceJson,
      subspaceSelection === 'new'
    );

    const { selectProject } = await inquirer.prompt([
      {
        message: `Do you want to add another project to the ${subspaceName} subspace?`,
        type: 'confirm',
        name: 'selectProject'
      }
    ]);
    continueToAdd = selectProject;
  } while (continueToAdd);

  console.log(
    chalk.green(
      `Please run "rush update --subspace ${subspaceName}" to regenerate the lockfile for this subspace.`
    )
  );

  console.log(
    chalk.green(
      `Make sure to test thoroughly after updating the lockfile, there may be changes in the dependency versions.`
    )
  );

  if (options.report) {
    const subspaceName: string = await querySubspace();
    const projectName: string = await queryProject('Please select a project to create a report for.');
    await generateProjectReport(projectName, subspaceName);
  }
}
