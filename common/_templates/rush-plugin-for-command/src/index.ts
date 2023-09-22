#!/usr/bin/env node

import { terminal } from './helpers/terminal';

process.exitCode = 1;
main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch(console.error);

async function main(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message) {
      terminal.writeErrorLine(error.message);
    } else {
      throw error;
    }
  }
}
