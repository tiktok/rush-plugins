import inquirer from 'inquirer';

export const chooseCommandPrompt = async (): Promise<string> => {
  const { command } = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What would you like to do?',
      choices: [
        { name: 'Move a project to a new subspace', value: 'move' },
        { name: 'Scan & fix version mismatches', value: 'sync' },
        { name: 'Clean common subspace versions', value: 'clean' },
        { name: 'Exit application', value: 'exit' }
      ]
    }
  ]);

  return command;
};
