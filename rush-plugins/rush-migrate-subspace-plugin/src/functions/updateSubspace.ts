import { FileSystem, JsonFile, JsonObject } from '@rushstack/node-core-library';
import Console from '../providers/console';
import chalk from 'chalk';
import { RushConstants } from '@rushstack/rush-sdk';
import { RushNameConstants } from '../constants/paths';

const updateSubspaceCommonVersionsFile = (
  sourceSubspaceFolderPath: string,
  targetSubspaceFolderPath: string
): void => {
  const sourceCommonVersionsFilePath: string = `${sourceSubspaceFolderPath}/${RushConstants.commonVersionsFilename}`;
  const targetCommonVersionsFilePath: string = `${targetSubspaceFolderPath}/${RushConstants.commonVersionsFilename}`;

  const sourceCommonVersions: JsonObject = JsonFile.load(sourceCommonVersionsFilePath);
  if (FileSystem.exists(targetCommonVersionsFilePath)) {
    const targetCommonVersions: JsonObject = JsonFile.load(targetCommonVersionsFilePath);

    for (const [dependency, version] of Object.entries<string>(sourceCommonVersions.preferredVersions)) {
      const targetPreferredVersion: string | undefined = targetCommonVersions.preferredVersions[dependency];
      if (targetPreferredVersion) {
        Console.warn(
          `There are conflicting values for ${chalk.bold(dependency)} in the ${chalk.bold(
            RushConstants.commonVersionsFilename
          )} file's preferredVersions: ${chalk.bold(version)} and ${chalk.bold(
            targetPreferredVersion
          )}. Please fix.`
        );
      } else {
        targetCommonVersions.preferredVersions[dependency] = version;
      }
    }

    for (const [dependency, versions] of Object.entries<string[]>(
      sourceCommonVersions.allowedAlternativeVersions
    )) {
      const targetAllowedAlternativeVersions: string[] =
        targetCommonVersions.allowedAlternativeVersions[dependency] || [];
      if (targetAllowedAlternativeVersions.length > 0) {
        const missingAllowedAlternativeVersions: string[] = versions.filter(
          (version) => !targetAllowedAlternativeVersions.includes(version)
        );
        targetCommonVersions.allowedAlternativeVersions[dependency] = [
          ...targetAllowedAlternativeVersions,
          ...missingAllowedAlternativeVersions
        ];
      } else {
        targetCommonVersions.allowedAlternativeVersions[dependency] = versions;
      }
    }

    Console.debug(
      `Merging ${chalk.bold(sourceCommonVersionsFilePath)} with ${chalk.bold(
        targetCommonVersionsFilePath
      )}...`
    );
    JsonFile.save(targetCommonVersions, targetCommonVersionsFilePath, {
      updateExistingFile: true
    });
  } else {
    Console.debug(
      `Copying ${chalk.bold(sourceCommonVersionsFilePath)} into ${chalk.bold(
        targetCommonVersionsFilePath
      )}...`
    );

    FileSystem.copyFile({
      sourcePath: sourceCommonVersionsFilePath,
      destinationPath: targetCommonVersionsFilePath
    });
  }
};

const updateSubspaceRepoStateFile = (
  sourceSubspaceFolderPath: string,
  targetSubspaceFolderPath: string
): void => {
  const sourceRepoStateFilePath: string = `${sourceSubspaceFolderPath}/${RushConstants.repoStateFilename}`;
  const targetRepoStateFilePath: string = `${targetSubspaceFolderPath}/${RushConstants.repoStateFilename}`;
  if (!FileSystem.exists(targetRepoStateFilePath)) {
    Console.debug(
      `Copying ${chalk.bold(sourceRepoStateFilePath)} into ${chalk.bold(targetRepoStateFilePath)}...`
    );

    FileSystem.copyFile({
      sourcePath: sourceRepoStateFilePath,
      destinationPath: targetRepoStateFilePath
    });
  }
};

const updateSubspacePnpmFile = (sourceSubspaceFolderPath: string, targetSubspaceFolderPath: string): void => {
  const sourcePnpmFilePath: string = `${sourceSubspaceFolderPath}/${RushNameConstants.PnpmSubspaceFileName}`;
  const targetPnpmFilePath: string = `${targetSubspaceFolderPath}/${RushNameConstants.PnpmSubspaceFileName}`;

  if (FileSystem.exists(sourcePnpmFilePath)) {
    if (FileSystem.exists(targetPnpmFilePath)) {
      const tempPnpmSubspaceFileName: string = `.pnpmfile-subspace-temp_${new Date().getTime()}.cjs`;
      const targetPnpmTempFilePath: string = `${targetSubspaceFolderPath}/${tempPnpmSubspaceFileName}`;
      Console.debug(
        `Duplicating temporary ${chalk.bold(sourcePnpmFilePath)} into ${chalk.bold(targetPnpmFilePath)}...`
      );

      FileSystem.copyFile({
        sourcePath: sourcePnpmFilePath,
        destinationPath: targetPnpmTempFilePath
      });

      Console.warn(
        `There are now two ${chalk.bold(RushNameConstants.PnpmSubspaceFileName)}. (${chalk.bold(
          RushNameConstants.PnpmSubspaceFileName
        )} and .${chalk.bold(tempPnpmSubspaceFileName)}). Please reconcile them into a singular ${chalk.bold(
          RushNameConstants.PnpmSubspaceFileName
        )} manually.`
      );
    } else {
      Console.debug(`Copying ${chalk.bold(sourcePnpmFilePath)} into ${chalk.bold(targetPnpmFilePath)}...`);
      FileSystem.copyFile({
        sourcePath: sourcePnpmFilePath,
        destinationPath: targetPnpmFilePath
      });
    }
  }
};

const updateSubspaceNpmRcFile = (
  sourceSubspaceFolderPath: string,
  targetSubspaceFolderPath: string
): void => {
  const sourceNpmRcFilePath: string = `${sourceSubspaceFolderPath}/${RushNameConstants.NpmRcFileName}`;
  const targetNpmRcFilePath: string = `${targetSubspaceFolderPath}/${RushNameConstants.NpmRcFileName}`;

  if (FileSystem.exists(sourceNpmRcFilePath)) {
    Console.debug(`Copying ${chalk.bold(sourceNpmRcFilePath)} into ${chalk.bold(targetNpmRcFilePath)}...`);
    FileSystem.copyFile({
      sourcePath: sourceNpmRcFilePath,
      destinationPath: targetNpmRcFilePath
    });
  }
};

export const updateSubspace = async (
  sourceSubspaceConfigurationFolderPath: string,
  targetSubspaceConfigurationFolderPath: string
): Promise<void> => {
  updateSubspaceNpmRcFile(sourceSubspaceConfigurationFolderPath, targetSubspaceConfigurationFolderPath);
  updateSubspaceCommonVersionsFile(
    sourceSubspaceConfigurationFolderPath,
    targetSubspaceConfigurationFolderPath
  );
  updateSubspaceRepoStateFile(sourceSubspaceConfigurationFolderPath, targetSubspaceConfigurationFolderPath);
  updateSubspacePnpmFile(sourceSubspaceConfigurationFolderPath, targetSubspaceConfigurationFolderPath);
};
