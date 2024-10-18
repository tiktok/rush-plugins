import { spawnSync } from 'child_process';
export const getMonorepoRootPath = () => {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf-8'
  });
  if (result.status !== 0) {
    throw new Error(`get monorepo root path failed`);
  }
  return result.stdout.toString().trim();
};
export const RootPath = getMonorepoRootPath();
