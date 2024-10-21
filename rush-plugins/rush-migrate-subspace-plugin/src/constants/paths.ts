import { getRootPath } from '../utilities/path';

export interface IRushPathConstants {
  RushConfigurationJson: string;
  SubspacesConfigurationJson: string;
  SubspacesFolder: string;
  DefaultSubspaceFolder: string;
  SubspacesConfigurationFolder: string;
  DefaultSubspaceConfigurationFolder: string;
  AnalysisJson: string;
  EdenMonorepoJson: string;
  EdenPipelineJson: string;
}

export const RushPathConstants: IRushPathConstants = {
  RushConfigurationJson: `${getRootPath()}/rush.json`,
  SubspacesConfigurationJson: `${getRootPath()}/common/config/rush/subspaces.json`,
  SubspacesFolder: `${getRootPath()}/subspaces`,
  DefaultSubspaceFolder: `${getRootPath()}/subspaces/default`,
  SubspacesConfigurationFolder: `${getRootPath()}/common/config/subspaces`,
  DefaultSubspaceConfigurationFolder: `${getRootPath()}/common/config/subspaces/default`,
  AnalysisJson: `${getRootPath()}/analysis.json`,
  EdenMonorepoJson: `${getRootPath()}/eden.monorepo.json`,
  EdenPipelineJson: `${getRootPath()}/eden.mono.pipeline.json`
};
