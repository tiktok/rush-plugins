import type { NestedRequired } from '../../helpers/type';
import type { IRushGitLFSPluginOption } from '../../options';

export interface IGitLFSModuleContext {
  option: NestedRequired<IRushGitLFSPluginOption>;
}
export abstract class GitLFSBaseModule {
  public abstract run(ctx: IGitLFSModuleContext): Promise<unknown>;
}
