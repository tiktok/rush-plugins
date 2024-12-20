import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getProjectPackageFilePath, queryProject } from '../utilities/project';
import { FileSystem, IPackageJson, JsonFile } from '@rushstack/node-core-library';
import { Colorize } from '@rushstack/terminal';
import Console from '../providers/console';

export const updateProjectDependency = async (
  projectName: string,
  dependencyName: string,
  newVersion: string,
  rootPath: string
): Promise<boolean> => {
  const project: IRushConfigurationProjectJson | undefined = queryProject(projectName, rootPath);
  if (!project) {
    Console.error(`Could not load find the project ${Colorize.bold(projectName)}.`);
    return false;
  }

  const pkgJsonPath: string = getProjectPackageFilePath(project.projectFolder, rootPath);
  if (!FileSystem.exists(pkgJsonPath)) {
    Console.error(`Could not load ${Colorize.bold(pkgJsonPath)}.`);
    return false;
  }

  const packageJson: IPackageJson = JsonFile.load(pkgJsonPath);
  if (packageJson?.dependencies && packageJson.dependencies[dependencyName]) {
    packageJson.dependencies[dependencyName] = newVersion;
  } else if (packageJson?.devDependencies && packageJson.devDependencies[dependencyName]) {
    packageJson.devDependencies[dependencyName] = newVersion;
  }

  JsonFile.save(packageJson, pkgJsonPath, { updateExistingFile: true });

  Console.success(
    `Updated ${Colorize.bold(dependencyName)} = ${Colorize.bold(newVersion)} in the project ${Colorize.bold(
      projectName
    )}!`
  );
  return true;
};
