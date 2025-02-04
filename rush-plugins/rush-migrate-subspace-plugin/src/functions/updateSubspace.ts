import { FileSystem, JsonFile } from '@rushstack/node-core-library';
import Console from '../providers/console';
import { Colorize } from '@rushstack/terminal';
import { RushConstants } from '@rushstack/rush-sdk';
import { RushNameConstants } from '../constants/paths';
import {
  getRushSubspaceCommonVersionsFilePath,
  getRushSubspaceConfigurationFolderPath,
  getRushSubspaceNpmRcFilePath,
  getRushSubspacePnpmFilePath
} from '../utilities/subspace';

const mergeSubspaceCommonVersionsFiles = (
  targetSubspaceName: string,
  sourceSubspaceFolderPath: string,
  rootPath: string
): void => {
  const sourceCommonVersionsFilePath: string = `${sourceSubspaceFolderPath}/${RushConstants.commonVersionsFilename}`;
  const targetCommonVersionsFilePath: string = getRushSubspaceCommonVersionsFilePath(
    targetSubspaceName,
    rootPath
  );

  const sourceCommonVersions: RushSubspaceCommonVersionsJson = JsonFile.load(sourceCommonVersionsFilePath);
  if (FileSystem.exists(targetCommonVersionsFilePath)) {
    const targetCommonVersionsConfiguration: RushSubspaceCommonVersionsJson = JsonFile.load(
      targetCommonVersionsFilePath
    );
    targetCommonVersionsConfiguration.allowedAlternativeVersions =
      targetCommonVersionsConfiguration.allowedAlternativeVersions || {};
    targetCommonVersionsConfiguration.preferredVersions =
      targetCommonVersionsConfiguration.preferredVersions || {};

    for (const [dependency, version] of Object.entries(sourceCommonVersions.preferredVersions || {})) {
      const targetPreferredVersion: string | undefined =
        targetCommonVersionsConfiguration.preferredVersions?.[dependency];
      if (targetPreferredVersion) {
        Console.warn(
          `There are conflicting values for ${Colorize.bold(dependency)} in the ${Colorize.bold(
            RushConstants.commonVersionsFilename
          )} file's preferredVersions: ${Colorize.bold(version)} and ${Colorize.bold(
            targetPreferredVersion
          )}. Please fix.`
        );
      } else {
        targetCommonVersionsConfiguration.preferredVersions[dependency] = version;
      }
    }

    for (const [dependency, versions] of Object.entries(
      sourceCommonVersions.allowedAlternativeVersions || {}
    )) {
      targetCommonVersionsConfiguration.allowedAlternativeVersions[dependency] = [
        ...(targetCommonVersionsConfiguration.allowedAlternativeVersions?.[dependency] || []),
        ...versions
      ];
    }

    Console.debug(
      `Merging ${Colorize.bold(sourceCommonVersionsFilePath)} with ${Colorize.bold(
        targetCommonVersionsFilePath
      )}...`
    );
    JsonFile.save(targetCommonVersionsConfiguration, targetCommonVersionsFilePath, {
      updateExistingFile: true
    });
  } else {
    Console.debug(
      `Copying ${Colorize.bold(sourceCommonVersionsFilePath)} into ${Colorize.bold(
        targetCommonVersionsFilePath
      )}...`
    );

    FileSystem.copyFile({
      sourcePath: sourceCommonVersionsFilePath,
      destinationPath: targetCommonVersionsFilePath
    });
  }
};

/**
 * We no longer need to copy the repoState file, since it should be generated by rush.
 */
/*
const copySubspaceRepoStateFile = (
  sourceSubspaceFolderPath: string,
  targetSubspaceFolderPath: string
): void => {
  const sourceRepoStateFilePath: string = `${sourceSubspaceFolderPath}/${RushConstants.repoStateFilename}`;
  const targetRepoStateFilePath: string = `${targetSubspaceFolderPath}/${RushConstants.repoStateFilename}`;
  if (!FileSystem.exists(targetRepoStateFilePath)) {
    Console.debug(
      `Copying ${Colorize.bold(sourceRepoStateFilePath)} into ${Colorize.bold(targetRepoStateFilePath)}...`
    );

    FileSystem.copyFile({
      sourcePath: sourceRepoStateFilePath,
      destinationPath: targetRepoStateFilePath
    });
  }
};
*/

const mergeSubspacePnpmFiles = (
  targetSubspaceName: string,
  sourceSubspaceFolderPath: string,
  rootPath: string
): void => {
  const sourcePnpmFilePath: string = `${sourceSubspaceFolderPath}/${RushNameConstants.PnpmSubspaceFileName}`;
  const targetPnpmFilePath: string = getRushSubspacePnpmFilePath(targetSubspaceName, rootPath);

  if (FileSystem.exists(sourcePnpmFilePath)) {
    if (FileSystem.exists(targetPnpmFilePath)) {
      const tempPnpmSubspaceFileName: string = `.pnpmfile-subspace-temp_${new Date().getTime()}.cjs`;
      const targetPnpmTempFilePath: string = `${getRushSubspaceConfigurationFolderPath(
        targetSubspaceName,
        rootPath
      )}/${tempPnpmSubspaceFileName}`;
      Console.debug(
        `Duplicating temporary ${Colorize.bold(sourcePnpmFilePath)} into ${Colorize.bold(
          targetPnpmFilePath
        )}...`
      );

      FileSystem.copyFile({
        sourcePath: sourcePnpmFilePath,
        destinationPath: targetPnpmTempFilePath
      });

      Console.warn(
        `There are now two ${Colorize.bold(RushNameConstants.PnpmSubspaceFileName)}. (${Colorize.bold(
          RushNameConstants.PnpmSubspaceFileName
        )} and .${Colorize.bold(
          tempPnpmSubspaceFileName
        )}). Please reconcile them into a singular ${Colorize.bold(
          RushNameConstants.PnpmSubspaceFileName
        )} manually.`
      );
    } else {
      Console.debug(
        `Copying ${Colorize.bold(sourcePnpmFilePath)} into ${Colorize.bold(targetPnpmFilePath)}...`
      );
      FileSystem.copyFile({
        sourcePath: sourcePnpmFilePath,
        destinationPath: targetPnpmFilePath
      });
    }
  }
};

const copySubspaceNpmRcFile = (
  targetSubspaceName: string,
  sourceSubspaceFolderPath: string,
  rootPath: string
): void => {
  const sourceNpmRcFilePath: string = `${sourceSubspaceFolderPath}/${RushNameConstants.NpmRcFileName}`;
  const targetNpmRcFilePath: string = getRushSubspaceNpmRcFilePath(targetSubspaceName, rootPath);

  if (FileSystem.exists(sourceNpmRcFilePath)) {
    Console.debug(
      `Copying ${Colorize.bold(sourceNpmRcFilePath)} into ${Colorize.bold(targetNpmRcFilePath)}...`
    );
    FileSystem.copyFile({
      sourcePath: sourceNpmRcFilePath,
      destinationPath: targetNpmRcFilePath
    });
  }
};

export const updateSubspace = async (
  targetSubspaceName: string,
  sourceSubspaceConfigurationFolderPath: string,
  rootPath: string
): Promise<void> => {
  copySubspaceNpmRcFile(targetSubspaceName, sourceSubspaceConfigurationFolderPath, rootPath);
  mergeSubspaceCommonVersionsFiles(targetSubspaceName, sourceSubspaceConfigurationFolderPath, rootPath);
  // copySubspaceRepoStateFile(sourceSubspaceConfigurationFolderPath, targetSubspaceConfigurationFolderPath);
  mergeSubspacePnpmFiles(targetSubspaceName, sourceSubspaceConfigurationFolderPath, rootPath);
};
