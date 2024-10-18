import { querySubspace } from './querySubspace';

const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');

// Important: Since we're calling an internal API, we need to use the unbundled .d.ts files
// instead of the normal .d.ts rollup
const { RushConfiguration } = require('@rushstack/rush-sdk');
const { JsonFile } = require('@rushstack/node-core-library');

// Use a path-based import to access an internal API (do so at your own risk!)
const {
  VersionMismatchFinder
} = require('@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinder');

export async function syncVersions() {
  const config = RushConfiguration.loadFromDefaultLocation();

  const subspaceName = await querySubspace();
  const selectedSubspace = config.subspaces.filter(
    (subspace: any) => subspace.subspaceName === subspaceName
  )[0];

  const { _projects: projects, _mismatches: mismatches } = VersionMismatchFinder.getMismatches(config, {
    subspace: selectedSubspace
  });
  const projectMap = new Map();
  for (const proj of projects) {
    projectMap.set(proj.packageName, proj._project);
  }

  if (mismatches.size === 0) {
    console.log(chalk.green('No mismatches found!'));
    return;
  }

  console.clear();

  let count = 0;
  const subspaceCommonVersionsPath = `${selectedSubspace.getSubspaceConfigFolder()}/common-versions.json`;
  const subspaceCommonVersionsJson = JsonFile.load(subspaceCommonVersionsPath);
  const allowedAlternativeVersions = subspaceCommonVersionsJson.allowedAlternativeVersions;
  for (const [dependencyName, mismatchVersionMap] of mismatches.entries()) {
    count++;

    const availableVersions = Array.from(mismatchVersionMap.keys());
    let selectedVersion;
    console.log(`Syncing package ${count} of ${mismatches.size + 1} version mismatches. \n`);
    console.log(chalk.green(`Syncing dependency: ${dependencyName}`));
    console.log(
      `There are ${mismatchVersionMap.size} different versions of the ${dependencyName} dependency: \n`
    );
    const { versionToSync } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionToSync',
        message: 'Which version would you like to sync all the packages to?',
        choices: [
          ...availableVersions.map((ver) => ({
            value: ver,
            name: `${ver} - used by ${mismatchVersionMap.get(ver).length} packages.`
          })),
          { name: 'Manual Entry', value: 'manual' },
          { name: 'Skip this package', value: 'skip' },
          { name: 'Add versions to allowedAlternativeVersions', value: 'alternative' }
        ]
      }
    ]);

    if (versionToSync === 'skip') {
      continue;
    } else if (versionToSync === 'manual') {
      const { newVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newVersion',
          message: `Please enter the version you wish to set for the ${dependencyName} package.`
        }
      ]);
      selectedVersion = newVersion.trim();
    } else if (versionToSync === 'alternative') {
      if (!allowedAlternativeVersions[dependencyName]) {
        allowedAlternativeVersions[dependencyName] = [];
      }
      allowedAlternativeVersions[dependencyName].push(...availableVersions);
    } else {
      selectedVersion = versionToSync;
    }

    if (selectedVersion) {
      // Only update package.jsons if we don't use alternative
      const allPackagesToUpdate = [];
      for (const key of availableVersions) {
        if (key !== selectedVersion) {
          allPackagesToUpdate.push(...mismatchVersionMap.get(key));
        }
      }
      for (const pkgToUpdate of allPackagesToUpdate) {
        const _project = config.getProjectByName(pkgToUpdate.packageName);
        const { projectFolder, packageName } = _project;
        const pkgJsonPath = `${projectFolder}/package.json`;
        if (!fs.existsSync(pkgJsonPath)) {
          console.log(chalk.red(`Could not load package.json file for package: ${packageName}, skipping...`));
          continue;
        }

        const packageJson = JsonFile.load(pkgJsonPath);
        if (packageJson?.dependencies && packageJson.dependencies[dependencyName]) {
          packageJson.dependencies[dependencyName] = selectedVersion;
        } else if (packageJson?.devDependencies && packageJson.devDependencies[dependencyName]) {
          packageJson.devDependencies[dependencyName] = selectedVersion;
        }
        JsonFile.save(packageJson, pkgJsonPath, { updateExistingFile: true });
      }
    }

    JsonFile.save(subspaceCommonVersionsJson, subspaceCommonVersionsPath, { updateExistingFile: true });
    console.clear();
  }

  console.log(chalk.green('Version sync complete! Please test and validate all affected packages.'));
}
