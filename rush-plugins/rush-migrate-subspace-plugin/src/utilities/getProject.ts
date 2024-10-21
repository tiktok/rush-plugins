import { JsonFile } from '@rushstack/node-core-library';

import { RootPath } from '../functions/getRootPath';
import { IRushConfigurationJson } from '@rushstack/rush-sdk/lib/api/RushConfiguration';
import { IRushConfigurationProjectJson } from '@rushstack/rush-sdk/lib/api/RushConfigurationProject';

export const getProject = (projectName: string): IRushConfigurationProjectJson => {
  const rushJson: IRushConfigurationJson = JsonFile.load(`${RootPath}/rush.json`);
  // Update rushJson for this project
  const projectToUpdate: IRushConfigurationProjectJson = rushJson.projects.filter(
    (project) => project.packageName === projectName
  )[0];
  return projectToUpdate;
};
