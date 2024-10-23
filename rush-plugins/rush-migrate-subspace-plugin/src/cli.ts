import { Command } from 'commander';
import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import { syncVersions } from './syncVersions';
import { generateReport } from './generateReport';
import { migrateProject } from './migrateProject';
import Console from './providers/console';

inquirer.registerPrompt('search-list', inquirerSearchList);

const program: Command = new Command();

program
  .option('--report', 'to generate only custom pipelines')
  .option('--sync', 'to sync the versions in a subspace')
  .option('--verbose', 'to provide more logs')
  .description('Example: rush migrate-subspace [--report] [--sync] [--verbose]')
  .action(async ({ sync, report, verbose }) => {
    Console.verbose = verbose;
    Console.title('Welcome to the Rush Migrate Subspace Plugin!');
    if (sync) {
      await syncVersions();
    } else if (report) {
      await generateReport();
    } else {
      await migrateProject();
    }
  });

program.parse();
