import { JsonFile } from '@rushstack/node-core-library';

import { RootPath } from '../functions/getRootPath';

export const getProject = (projectName: string) => {
  const rushJson = JsonFile.load(`${RootPath}/rush.json`);
  // Update rushJson for this project
  const projectToUpdate = rushJson.projects.filter((project: any) => project.packageName === projectName)[0];
  return projectToUpdate;
};
