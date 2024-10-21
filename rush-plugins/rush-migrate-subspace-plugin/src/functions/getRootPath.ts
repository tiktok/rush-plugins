import { spawnSync, SpawnSyncReturns } from 'child_process';
export const getMonorepoRootPath = (): string => {
  const result: SpawnSyncReturns<string> = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf-8'
  });
  if (result.status !== 0) {
    throw new Error('get monorepo root path failed');
  }

  return result.stdout.toString().trim();
};

export const RootPath: string = getMonorepoRootPath();
