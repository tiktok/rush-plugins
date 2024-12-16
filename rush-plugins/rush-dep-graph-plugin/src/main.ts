import { Terminal, ConsoleTerminalProvider } from '@rushstack/terminal';
import archy from 'archy';
import { RushConfiguration, RushConfigurationProject } from '@rushstack/rush-sdk';
import chalk from 'chalk';

export const enum Selector {
  To = 'to',
  From = 'from'
}

export class ListGraph {
  private readonly _terminal: Terminal;
  private readonly _rushConfiguration: RushConfiguration;
  private readonly _selector: Selector;
  private readonly _projectName: string;
  private readonly _filter?: string;
  private readonly _visited: Set<string>;

  constructor(selector: Selector, projectName: string, filter?: string) {
    this._terminal = new Terminal(new ConsoleTerminalProvider());
    this._rushConfiguration = RushConfiguration.loadFromDefaultLocation();
    this._selector = selector;
    this._projectName = projectName;
    this._filter = filter;
    this._visited = new Set();
  }

  private _pruneDepsTree(data: archy.Data): boolean {
    if (!data.nodes) return false;

    data.nodes = (data.nodes as archy.Data[]).filter((node) => {
      const isSubtreeIncludesFilter: boolean =
        this._pruneDepsTree(node) || node.label.includes(this._filter!);
      return isSubtreeIncludesFilter;
    });

    return data.nodes.length > 0;
  }

  private _buildDepsTree(data: archy.Data): void {
    const projectName: string = data.label;
    const project: RushConfigurationProject | undefined =
      this._rushConfiguration.getProjectByName(projectName);
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }

    if (this._visited.has(projectName)) {
      data.label = data.label + chalk.yellow(' (circular)');
      return;
    }

    this._visited.add(projectName);

    const consumingOrDependencyProjects: ReadonlySet<RushConfigurationProject> =
      this._selector === Selector.From ? project.consumingProjects : project.dependencyProjects;
    if (consumingOrDependencyProjects.size > 0) {
      data.nodes = Array.from(consumingOrDependencyProjects).map((project) => ({
        label: project.packageName
      }));
      for (const node of data.nodes) {
        this._buildDepsTree(node as archy.Data);
      }
    }

    this._visited.delete(projectName);
  }

  public async runAsync(): Promise<string> {
    const data: archy.Data = {
      label: this._projectName
    };
    this._buildDepsTree(data);
    if (this._filter) {
      this._pruneDepsTree(data);
    }
    const output: string = archy(data);
    this._terminal.writeLine(output);
    return output;
  }
}
