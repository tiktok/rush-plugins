import { compare, eq, minVersion, satisfies, subset, valid, validRange } from 'semver';

export const subsetVersion = (version1: string, version2: string): boolean => {
  if (version1 === version2) {
    return true;
  } else if (['latest', 'workspace:*'].includes(version2)) {
    return true;
  } else if ((!valid(version1) && !validRange(version1)) || (!valid(version2) && !validRange(version2))) {
    return false;
  }

  return subset(version1, version2);
};

export const sortVersions = (versions: string[]): string[] => {
  const newVersions: string[] = [...versions];
  newVersions.sort((v1, v2) => {
    if (v1 === v2) {
      // e.g. 1.0.0 , 1.0.0
      return 0;
    } else if (['latest', 'workspace:*'].includes(v1)) {
      // e.g. workspace:*, 1.0.0
      return 1;
    } else if (['latest', 'workspace:*'].includes(v2)) {
      // e.g. 1.0.0, workspace:*
      return -1;
    } else if (!valid(v1) && !validRange(v1)) {
      return -1;
    } else if (!valid(v2) && !validRange(v2)) {
      return 1;
    }

    const v1Range: string | undefined = validRange(v1) ? v1 : undefined;
    const v2Range: string | undefined = validRange(v2) ? v2 : undefined;
    const v1Fixed: string | undefined = v1Range ? minVersion(v1)?.format() : v1;
    const v2Fixed: string | undefined = v2Range ? minVersion(v2)?.format() : v2;

    if (!v1Fixed || !v2Fixed) {
      return -1;
    }

    if (eq(v1Fixed, v2Fixed)) {
      if (v1Range && v2Range) {
        if (subset(v1Range, v2Range)) {
          // e.g. ~1.0.0 , ^1.0.0
          return 1;
        } else if (subset(v2Range, v1Range)) {
          // e.g. ^1.0.0 , ~1.0.0
          return -1;
        }
      } else if (v1Range) {
        // e.g. ~1.0.0 , 1.0.0
        return satisfies(v2Fixed, v1Range) ? -1 : 1;
      } else if (v2Range) {
        // e.g. 1.0.0 , ~1.0.0
        return satisfies(v1Fixed, v2Range) ? 1 : -1;
      }
    }

    // e.g. 1.0.0 , 1.0.1
    return compare(v1Fixed, v2Fixed);
  });

  return newVersions;
};

export const getRecommendedVersion = (targetVersion: string, versions: string[]): string | undefined => {
  return sortVersions(versions).find((version) => subsetVersion(targetVersion, version));
};
