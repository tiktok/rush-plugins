import { RushConstants } from '@rushstack/rush-sdk';

export interface IRushPathConstants {
  SubspacesConfigurationFilePath: string;
  SubspacesConfigurationFolderPath: string;
}

export interface IRushNameConstants {
  AnalysisFileName: string;
  EdenMonorepoFileName: string;
  EdenPipelineFileName: string;
  PnpmSubspaceFileName: string;
  SubspacesFolderName: string;
  NpmRcFileName: string;
}

export const RushNameConstants: IRushNameConstants = {
  AnalysisFileName: 'analysis.json',
  NpmRcFileName: '.npmrc',
  EdenMonorepoFileName: 'eden.monorepo.json',
  EdenPipelineFileName: 'eden.mono.pipeline.json',
  PnpmSubspaceFileName: '.pnpmfile-subspace.cjs',
  SubspacesFolderName: 'subspaces'
};

export const RushPathConstants: IRushPathConstants = {
  SubspacesConfigurationFilePath: `${RushConstants.commonFolderName}/config/rush/${RushConstants.subspacesConfigFilename}`,
  SubspacesConfigurationFolderPath: `${RushConstants.commonFolderName}/config/${RushNameConstants.SubspacesFolderName}`
};
