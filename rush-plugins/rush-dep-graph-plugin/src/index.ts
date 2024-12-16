import { Command } from 'commander';
import { ListGraph, Selector } from './main';

export interface ICommandOption {
  to?: string;
  from?: string;
  filter?: string;
}

const program: Command = new Command();

program
  .option('-t|--to <package>')
  .option('-f|--from <package>')
  .option('--filter <package>')
  .action(async (option: ICommandOption) => {
    const { to, from, filter } = option;

    const selector: Selector = to ? Selector.To : Selector.From;
    const projectName: string | undefined = to ?? from;

    if (projectName === undefined) {
      throw new Error('Please input at least one project.');
    }

    const listGraph: ListGraph = new ListGraph(selector, projectName, filter);
    await listGraph.runAsync();
  });

program.parse(process.argv);
