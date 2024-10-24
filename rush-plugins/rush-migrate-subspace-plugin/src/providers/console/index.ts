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
    console.log(`ℹ️ ${chalk.blue(message)}`);
  }

  public static warn(message: string): void {
    console.log(`🚧 ${chalk.yellow(message)}`);
  }

  public static error(message: string): void {
    console.log(`🚫 ${chalk.red(message)}`);
  }

  public static debug(message: string): void {
    if (!Console._verbose) {
      return;
    }

    console.log(`💬 ${chalk.grey(message)}`);
  }

  public static log(message: string): void {
    console.log(chalk.grey(message));
  }

  public static title(message: string): void {
    console.log(`\n${chalk.bold(message)}`);
  }

  public static success(message: string): void {
    console.log(`✅ ${chalk.green(message)}`);
  }

  public static clear(): void {
    console.clear();
  }
}
