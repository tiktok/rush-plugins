import fs from 'fs';
import path from 'path';
import { Terminal, ConsoleTerminalProvider } from '@rushstack/terminal';
import { PACKAGE_JSON } from './constants';

export const logProvider: ConsoleTerminalProvider = new ConsoleTerminalProvider();
export const logger: Terminal = new Terminal(logProvider);

export const lookUpPackageJson = (currentDir: string): string | undefined => {
  while (currentDir !== '.') {
    const packageJsonPath: string = path.resolve(currentDir, PACKAGE_JSON);
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = path.resolve(currentDir, '..');
  }
  return undefined;
};
