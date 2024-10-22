import { Command } from 'commander';
import { main } from './main';
import { syncVersions } from './functions/syncVersions';
import { generateReport } from './functions/generateReport';

const program: Command = new Command();

program
  .option('-r|--report', 'to generate only custom pipelines')
  .option('--sync', 'to sync the versions in a subspace')
  .description('Example: rush migrate-subspace [--report] [--sync]')
  .action(async (option) => {
    if (option.sync) {
      await syncVersions();
    } else if (option.report) {
      await generateReport();
    } else {
      await main();
    }
  });

program.parse();
