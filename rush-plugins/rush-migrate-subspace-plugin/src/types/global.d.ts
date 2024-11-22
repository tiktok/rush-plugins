declare module 'inquirer-search-list';

declare interface RushSubspaceCommonVersionsJson {
  preferredVersions?: {
    [dependency: string]: string;
  };
  allowedAlternativeVersions?: {
    [dependency: string]: string[];
  };
  ensureConsistentVersions?: boolean;
}
