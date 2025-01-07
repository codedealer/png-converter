import logger from "./logger";
import { readFileSync, existsSync, writeFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { validatePath } from "./utils";

const CONFIG = 'png-converter.json' as const;

export interface Options {
  // directory to convert files at
  directory: string | null;
  // whether to delete the original files on success
  deleteOriginal: boolean;
  // whether to preserve the file attributes of the original
  preserveAttributes: boolean;
  // stop on error or continue with the next file
  careful: boolean;
  imageOptions: {
    type: 'jpg' | 'webp';
    quality: number;
    maxWidth: number | null;
    maxHeight: number | null;
  }
}

const defaultOptions: Options = {
  directory: null,
  deleteOriginal: false,
  preserveAttributes: true,
  careful: false,
  imageOptions: {
    type: 'webp',
    quality: 90,
    maxWidth: null,
    maxHeight: null,
  }
}

const optionsExists = (directoryOrFile: string): boolean => {
  const stats = existsSync(directoryOrFile) ? statSync(directoryOrFile) : null;
  if (!stats) {
    return false;
  }

  if (stats.isFile()) {
    return true;
  }

  if (!stats.isDirectory()) {
    throw new Error(`Invalid path: ${directoryOrFile}`);
  }

  const configPath = join(directoryOrFile, CONFIG);
  return existsSync(configPath);
}

const getDefaultOptions = (): Options => {
  return structuredClone(defaultOptions);
}

const saveOptions = (options: Options, directory: string): void => {
  const json = JSON.stringify(options, null, 2);
  const configPath = join(directory, CONFIG);
  writeFileSync(configPath, json);
}

/**
 * Make sure that the JSON structure is an object containing the expected keys from defaultOptions
 * @param obj
 */
const validateJSONObject = (obj: unknown): obj is Options => {
  return typeof obj === 'object' && obj !== null && Object.keys(defaultOptions).every(key => key in obj);
}

const loadOptions = (directoryOrFile: string): Options => {
  if (!directoryOrFile) {
    throw new Error(`Config path not provided`);
  }

  const stats = statSync(directoryOrFile);
  const configPath = stats.isDirectory() ? join(directoryOrFile, CONFIG) : directoryOrFile;

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found at '${configPath}'`);
  }

  const json = readFileSync(configPath, 'utf8');
  const options = JSON.parse(json);
  if (!validateJSONObject(options)) {
    throw new Error(`Invalid config file: ${configPath}`);
  } else {
    logger.info(`Config file loaded from '${configPath}'`);
  }

  // validate the directory path
  if (!options.directory) {
    throw new Error(`Directory not specified in the config file: ${configPath}`);
  }
  const optionsDirStats = statSync(options.directory);
  if (!optionsDirStats.isDirectory()) {
    throw new Error(`Invalid directory in the config file: ${options.directory}`);
  }
  options.directory = validatePath(options.directory, dirname(options.directory));

  return { ...getDefaultOptions(), ...options };
}

export { saveOptions, loadOptions, optionsExists, getDefaultOptions };
