import { Command } from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import { IPackageJson, JsonFile } from '@rushstack/node-core-library';
import inquirerSearchList from 'inquirer-search-list';
import { syncVersions } from './syncVersions';
import { migrateProject } from './migrateProject';
import Console from './providers/console';
import { interactMenu } from './interactMenu';
import { cleanSubspace } from './cleanSubspace';
import { getRootPath } from './utilities/path';

inquirer.registerPrompt('search-list', inquirerSearchList);

const program: Command = new Command();

program
  .option('--sync', 'to sync the versions in a subspace')
  .option('--move', 'to move projects to a new subspace')
  .option('--clean', 'to reduce subspace alternative versions')
  .option('--debug', 'to provide debug logs')
  .description('Example: rush migrate-subspace [--move] [--sync] [--debug] [--clean]')
  .action(async ({ sync, debug, move, clean }) => {
    const packageJson: IPackageJson = JsonFile.load(`${path.resolve(__dirname, '../package.json')}`);

    Console.enableDebug(debug);
    Console.title(`🚀 Rush Migrate Subspace Plugin - version ${packageJson.version}`);
    Console.newLine();

    const sourceMonorepoPath: string = getRootPath();
    const targetMonorepoPath: string = getRootPath();

    if (sync) {
      await syncVersions(targetMonorepoPath);
    } else if (move) {
      await migrateProject(sourceMonorepoPath, targetMonorepoPath);
    } else if (clean) {
      await cleanSubspace(targetMonorepoPath);
    } else {
      await interactMenu(sourceMonorepoPath, targetMonorepoPath);
    }
  });

program.parse();
