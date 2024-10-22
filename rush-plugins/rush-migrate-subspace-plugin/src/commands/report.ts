import inquirer from 'inquirer';
import { RushPathConstants } from '../constants/paths';

export const confirmSaveReport = async (): Promise<boolean> => {
  const { saveToFile } = await inquirer.prompt([
    {
      message: 'Do you want to output the results to a JSON file?',
      type: 'confirm',
      name: 'saveToFile'
    }
  ]);

  return saveToFile;
};

export const enterReportFileLocation = async (): Promise<string> => {
  const { filePath } = await inquirer.prompt([
    {
      message: `Please enter the file path to save this file. Please do not commit it to git.`,
      type: 'input',
      name: 'filePath',
      default: RushPathConstants.AnalysisJson
    }
  ]);

  return filePath;
};
