import { Command } from 'commander';
import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import { syncVersions } from './syncVersions';
import { generateReport } from './generateReport';
import { migrateProject } from './migrateProject';
import Console from './providers/console';
import { interactMenu } from './interactMenu';

inquirer.registerPrompt('search-list', inquirerSearchList);

const program: Command = new Command();

program
  .option('--analyze', 'to generate all version mismatches for a single project')
  .option('--sync', 'to sync the versions in a subspace')
  .option('--move', 'to move projects to a new subspace')
  .option('--debug', 'to provide debug logs')
  .description('Example: rush migrate-subspace [--move] [--analyze] [--sync] [--debug]')
  .action(async ({ sync, analyze, debug, move }) => {
    Console.enableDebug(debug);
    Console.title('🚀 Welcome to the Rush Migrate Subspace Plugin!');
    Console.newLine();

    if (sync) {
      await syncVersions();
    } else if (analyze) {
      await generateReport();
    } else if (move) {
      await migrateProject();
    } else {
      await interactMenu();
    }
  });

program.parse();
