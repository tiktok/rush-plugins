import { chooseSubspacePrompt } from './prompts/subspace';
import Console from './providers/console';
import { getRootPath } from './utilities/path';
import { Colorize } from '@rushstack/terminal';
import {
  cleanSubspaceCommonVersions,
  getRushSubspaceCommonVersionsFilePath,
  isSubspaceSupported
} from './utilities/subspace';
import { getRushSubspacesConfigurationJsonPath, querySubspaces } from './utilities/repository';
import { RushConstants } from '@rushstack/rush-sdk';

export const cleanSubspace = async (): Promise<void> => {
  Console.debug('Executing clean subspace command...');

  const targetSubspaces: string[] = querySubspaces();
  if (!isSubspaceSupported()) {
    Console.error(
      `The monorepo ${Colorize.bold(
        getRootPath()
      )} doesn't support subspaces! Make sure you have ${Colorize.bold(
        getRushSubspacesConfigurationJsonPath()
      )} with the ${Colorize.bold(RushConstants.defaultSubspaceName)} subspace. Exiting...`
    );
    return;
  }

  const targetSubspace: string = await chooseSubspacePrompt(targetSubspaces);
  Console.title(`🛁 Cleaning subspace ${Colorize.underline(targetSubspace)} common versions...`);

  if (cleanSubspaceCommonVersions(targetSubspace)) {
    Console.success(
      `${Colorize.bold(
        getRushSubspaceCommonVersionsFilePath(targetSubspace)
      )} has been successfully refactored!`
    );
  } else {
    Console.success(`The subspace ${Colorize.bold(targetSubspace)} doesn't require cleaning! Exiting...`);
  }
};
