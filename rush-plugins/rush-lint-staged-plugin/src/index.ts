#!/usr/bin/env node

import lintStaged from 'lint-staged';

// import { terminal } from "./helpers/terminal.mjs";

process.exitCode = 1;
main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch(console.error);

async function main(): Promise<void> {
  try {
    // https://github.com/okonet/lint-staged/pull/1080
    const success: boolean = await lintStaged();
    if (!success) process.exit(1);
  } catch (error: any) {
    if (error.message) {
      // terminal.writeErrorLine(error.message);
    } else {
      throw error;
    }
  }
}
