#!/usr/bin/env node

import { upgradeSelf } from './upgrade-self';

process.exitCode = 1;
main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch(console.error);

async function main(): Promise<void> {
  try {
    await upgradeSelf();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message) {
      console.log(error.message);
    } else {
      throw error;
    }
  }
}
