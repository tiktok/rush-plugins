import { EnvironmentVariableNames } from '@rushstack/rush-sdk';

export const RUSH_EVOKE_FOLDER: string = process.env[EnvironmentVariableNames.RUSH_INVOKED_FOLDER] as string;

export const PACKAGE_JSON: 'package.json' = 'package.json';
