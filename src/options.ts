import logger from "./logger";
import { existsSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { validatePath } from "./utils";
import { validateOptions } from "./validator";

const CONFIG = 'png-converter.json' as const;

export interface Options {
  // directory to convert files at
  directory?: string | null;
  // whether to delete the original files on success
  deleteOriginal: boolean;
  // whether to preserve the file attributes of the original
  preserveAttributes: boolean;
  // stop on error or continue with the next file
  careful: boolean;
  // whether to scan subdirectories
  deep: boolean;
  // watch for new files
  watch: boolean;
  imageOptions: {
    type: 'jpg' | 'webp';
    quality: number;
    maxWidth?: number | null;
    maxHeight?: number | null;
  }
}

export interface ValidatedOptions extends Options {
  directory: string;
}

const defaultOptions: Options = {
  directory: null,
  deleteOriginal: false,
  preserveAttributes: true,
  careful: false,
  deep: false,
  watch: false,
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

const loadOptions = (directoryOrFile: string): ValidatedOptions => {
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
  if (!validateOptions(options)) {
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

  return { ...getDefaultOptions(), ...options } as ValidatedOptions;
}

export { saveOptions, loadOptions, optionsExists, getDefaultOptions };
