import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getRootPath } from './path';
import { loadRushConfiguration } from './repository';
import { getSubspaceMismatches } from './subspace';
import { VersionMismatchFinderEntity } from '@rushstack/rush-sdk/lib/logic/versionMismatch/VersionMismatchFinderEntity';
import { RushNameConstants } from '../constants/paths';
import { IPackageJson, IPackageJsonDependencyTable, JsonFile } from '@rushstack/node-core-library';

export const getProjectPackageFilePath = (
  projectFolder: string,
  rootPath: string = getRootPath()
): string => {
  return `${rootPath}/${projectFolder}/${RushNameConstants.PackageName}`;
};

export const loadProjectPackageJson = (
  projectFolder: string,
  rootPath: string = getRootPath()
): IPackageJson => {
  return JsonFile.load(getProjectPackageFilePath(projectFolder, rootPath));
};

export const queryProjects = (rootPath: string = getRootPath()): IRushConfigurationProjectJson[] => {
  const rushJson: IRushConfigurationJson = loadRushConfiguration(rootPath);
  return rushJson.projects;
};

export const queryProjectsWithoutSubspace = (
  rootPath: string = getRootPath()
): IRushConfigurationProjectJson[] => {
  const projects: IRushConfigurationProjectJson[] = queryProjects(rootPath);
  return projects.filter(({ subspaceName }) => !subspaceName);
};

export const queryProject = (
  projectName: string,
  rootPath: string = getRootPath()
): IRushConfigurationProjectJson | undefined => {
  const projects: IRushConfigurationProjectJson[] = queryProjects(rootPath);
  return projects.find(({ packageName }) => packageName === projectName);
};

export const getProjectMismatches = (
  projectName: string,
  rootPath: string = getRootPath()
): ReadonlyMap<string, ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>> => {
  const project: IRushConfigurationProjectJson | undefined = queryProject(projectName, rootPath);
  if (!project || !project.subspaceName) {
    return new Map();
  }

  const projectMismatches: Map<string, ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>> = new Map<
    string,
    Map<string, VersionMismatchFinderEntity[]>
  >();
  const subspaceMismatches: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly VersionMismatchFinderEntity[]>
  > = getSubspaceMismatches(project.subspaceName, rootPath);
  for (const [dependency, mismatches] of subspaceMismatches) {
    for (const [, mismatch] of mismatches) {
      const projectMismatch: VersionMismatchFinderEntity | undefined = mismatch.find(
        ({ friendlyName }) => friendlyName === projectName
      );

      if (projectMismatch) {
        projectMismatches.set(dependency, mismatches);
        break;
      }
    }
  }

  return projectMismatches;
};

export const getProjectDependencies = (
  projectName: string,
  rootPath: string = getRootPath()
): IPackageJsonDependencyTable | undefined => {
  const project: IRushConfigurationProjectJson | undefined = queryProject(projectName, rootPath);
  if (!project || !project.subspaceName) {
    return;
  }

  const projectPackageJson: IPackageJson = loadProjectPackageJson(project.projectFolder, rootPath);
  return {
    ...projectPackageJson.dependencies,
    ...projectPackageJson.devDependencies
  };
};
