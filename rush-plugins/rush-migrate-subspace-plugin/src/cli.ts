import { Command } from 'commander';
import { main } from './main';
import { syncVersions } from './functions/syncVersions';

export type CommandOption = {};

const program = new Command();

program
  .option('-r|--report', 'to generate only custom pipelines')
  .option('--sync', 'to sync the versions in a subspace')
  .description('Example: rush migrate-subspace [--report] [--sync]')
  .action(async (option) => {
    if (option.sync) {
      await syncVersions();
    } else {
      await main(option);
    }
  });

program.parse();
