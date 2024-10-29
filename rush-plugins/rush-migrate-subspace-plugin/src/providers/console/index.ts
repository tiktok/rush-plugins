import { Colorize } from '@rushstack/terminal';

export default class Console {
  private static _debugEnabled: boolean = false;

  public static enableDebug(value: boolean): void {
    Console._debugEnabled = value;
  }

  public static newLine(): void {
    console.log('\n');
  }

  public static info(message: string): void {
    console.log(`ℹ️ ${Colorize.blue(message)}`);
  }

  public static warn(message: string): void {
    console.log(`🚧 ${Colorize.yellow(message)}`);
  }

  public static error(message: string): void {
    console.log(`🚫 ${Colorize.red(message)}`);
  }

  public static debug(message: string): void {
    if (!Console._debugEnabled) {
      return;
    }

    console.log(`💬 ${Colorize.gray(message)}`);
  }

  public static log(message: string): void {
    console.log(Colorize.black(message));
  }

  public static title(message: string): void {
    Console.newLine();
    console.log(Colorize.bold(message));
  }

  public static success(message: string): void {
    console.log(`✅ ${Colorize.green(message)}`);
  }

  public static clear(): void {
    console.clear();
  }
}
