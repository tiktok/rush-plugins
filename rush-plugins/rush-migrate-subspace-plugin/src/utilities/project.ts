import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { getRootPath } from './path';
import { loadRushConfiguration } from './repository';

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
