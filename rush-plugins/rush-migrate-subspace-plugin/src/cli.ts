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
    Console.title(`🚀 Welcome to the Rush Migrate Subspace Plugin! Version: ${packageJson.version}`);
    Console.newLine();

    if (sync) {
      await syncVersions();
    } else if (move) {
      await migrateProject();
    } else if (clean) {
      await cleanSubspace();
    } else {
      await interactMenu();
    }
  });

program.parse();
