import { JsonFile } from '@rushstack/node-core-library';

import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';
import { RushPathConstants } from '../constants/paths';

export const getProject = (projectName: string): IRushConfigurationProjectJson => {
  const rushJson: IRushConfigurationJson = JsonFile.load(RushPathConstants.RushConfigurationJson);
  // Update rushJson for this project
  const projectToUpdate: IRushConfigurationProjectJson = rushJson.projects.filter(
    (project) => project.packageName === projectName
  )[0];
  return projectToUpdate;
};
