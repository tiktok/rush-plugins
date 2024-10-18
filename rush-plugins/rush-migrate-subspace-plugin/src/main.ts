import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import chalk from 'chalk';
import { JsonFile } from '@rushstack/node-core-library';
import { querySubspace } from './functions/querySubspace';
import { RootPath } from './functions/getRootPath';
import { addProjectToSubspace } from './functions/addProjectToSubspace';
import { getProject } from './utilities/getProject';
import { generateProjectReport } from './functions/generateProjectReport';
import { queryProject } from './functions/queryProject';

inquirer.registerPrompt('search-list', inquirerSearchList);

type RunOptions = {
  report?: boolean;
};

export async function main(options: RunOptions) {
  if (options.report) {
    const subspaceName = await querySubspace();
    const project = await queryProject('Please select a project to create a report for.');
    await generateProjectReport(project, subspaceName);
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

  const subspaceJson = JsonFile.load(`${RootPath}/common/config/rush/subspaces.json`);
  const rushJson = JsonFile.load(`${RootPath}/rush.json`);
  let subspaceName: string | undefined;
  if (subspaceSelection === 'existing') {
    subspaceName = await querySubspace();
  } else {
    while (!subspaceName) {
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
        subspaceName = subspaceNameInput;
      }
    }
  }

  console.log('Adding to subspace: ', subspaceName);

  // Loop until user asks to quit
  let continueToAdd = true;
  do {
    const projectToAdd = await queryProject(
      `Please select a project to add to the ${subspaceName} subspace.`,
      (project: any) => project.subspaceName !== subspaceName
    );

    // Update rushJson for this project
    const projectToUpdate = getProject(projectToAdd);

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
}
