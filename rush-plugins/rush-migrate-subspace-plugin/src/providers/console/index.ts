import chalk from 'chalk';

export default class Console {
  private static _verbose: boolean = false;

  public static get verbose(): boolean {
    return Console._verbose;
  }

  public static set verbose(value: boolean) {
    Console._verbose = value;
  }

  public static info(message: string): void {
    console.log(chalk.blue('[INFO]'), chalk.blueBright(message));
  }

  public static warn(message: string): void {
    console.log(chalk.bgYellowBright('[WARNING]'), chalk.yellow(message));
  }

  public static error(message: string): void {
    console.log(chalk.bgRedBright('[ERROR]'), chalk.red(message));
  }

  public static debug(message: string): void {
    if (!Console._verbose) {
      return;
    }

    console.log(chalk.cyan('[DEBUG]'), chalk.cyanBright(message));
  }

  public static log(message: string): void {
    console.log(chalk.grey(message));
  }

  public static title(message: string): void {
    console.log(`\n${chalk.underline(chalk.bold(chalk.black(message)))}\n`);
  }

  public static success(message: string): void {
    console.log(chalk.green('[SUCCESS]'), chalk.greenBright(message));
  }

  public static clear(): void {
    console.clear();
  }
}
