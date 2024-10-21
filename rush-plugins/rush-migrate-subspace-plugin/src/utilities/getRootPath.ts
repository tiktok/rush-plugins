import { spawnSync, SpawnSyncReturns } from 'child_process';

const _getMonorepoRootPath = (): string => {
  const result: SpawnSyncReturns<string> = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf-8'
  });
  if (result.status !== 0) {
    throw new Error('get monorepo root path failed');
  }

  return result.stdout.toString().trim();
};

export const getRootPath = (): string => {
  let rootPath: string | undefined;
  return (() => {
    if (rootPath) {
      return rootPath;
    }

    rootPath = _getMonorepoRootPath();
    return rootPath;
  })();
};
