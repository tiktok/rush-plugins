import minimist from 'minimist';
import path from 'path';
import fs from 'fs';
import { JsonFile, INodePackageJson } from '@rushstack/node-core-library';
import { Colorize } from '@rushstack/terminal';

import { PACKAGE_JSON, RUSH_EVOKE_FOLDER } from './constants';
import { lookUpPackageJson, logger } from './utils';

(async () => {
  const argv: minimist.ParsedArgs = minimist(process.argv.slice(2));
  const targetPath: string = path.resolve(RUSH_EVOKE_FOLDER, argv.path);
  const targetJsonPath: string = path.resolve(targetPath, PACKAGE_JSON);

  if (!fs.existsSync(targetJsonPath)) {
    throw new Error(`Can not find ${PACKAGE_JSON} in the path ${argv.path}`);
  }

  const originJsonPath: string | undefined = lookUpPackageJson(RUSH_EVOKE_FOLDER);

  if (!originJsonPath) {
    throw new Error(`Cannot find ${PACKAGE_JSON} in the path ${RUSH_EVOKE_FOLDER}`);
  }

  const packageJson: INodePackageJson = JsonFile.load(targetJsonPath);

  let packageName: string = packageJson.name;
  let nodeModulesPath: string = path.resolve(originJsonPath, 'node_modules');
  if (packageName.includes('/')) {
    const [scope, packageBaseName] = packageName.split('/');
    nodeModulesPath = path.resolve(nodeModulesPath, scope);
    packageName = packageBaseName;
  }

  if (!fs.existsSync(nodeModulesPath)) {
    logger.writeLine(`'node_modules' directory does not exist at ${nodeModulesPath}. Creating...`);
    fs.mkdirSync(nodeModulesPath, { recursive: true });
  }

  const linkPath: string = path.resolve(nodeModulesPath, packageName);

  if (fs.existsSync(linkPath)) {
    logger.writeLine(
      Colorize.yellow(`Soft link already exists for '${packageName}' in 'node_modules'. Skipping creation.`)
    );
  } else {
    fs.symlinkSync(targetPath, linkPath);
    logger.writeLine(
      Colorize.green(`Successfully created a symbolic link for '${packageName}' in 'node_modules'.`)
    );
  }
})().catch((e) => logger.writeErrorLine(e?.message ?? e));
