import { compare, eq, intersects, minVersion, satisfies, subset, validRange } from 'semver';

export const sortVersions = (versions: string[]): string[] => {
  return versions.sort((v1, v2) => {
    if (v1 === v2) {
      // e.g. 1.0.0 , 1.0.0
      return 0;
    }

    if (v1 === 'workspace:*' || v2 === 'workspace:*') {
      // e.g. workspace:*
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
          return -1;
        } else if (subset(v2Range, v1Range)) {
          // e.g. ^1.0.0 , ~1.0.0
          return 1;
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
};

export const getRecommendedVersion = (targetVersion: string, versions: string[]): string => {
  return sortVersions(versions).find((version) => intersects(targetVersion, version)) || versions[0];
};
