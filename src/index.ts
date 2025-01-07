import { statSync } from 'fs';
import { join, isAbsolute, dirname } from 'path';
import logger from './logger';
import { getDefaultOptions, loadOptions, optionsExists, saveOptions } from "./options";
import inquirer from "inquirer";
import { consumeList, listImages } from "./images";
import { validatePath } from "./utils";

const getWorkingDirectoryOrConfigFile = (): string => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    return process.cwd();
  }

  const path = isAbsolute(args[0]) ? args[0] : join(process.cwd(), args[0]);
  const stats = statSync(path);

  if (!stats.isFile() && !stats.isDirectory()) {
    throw new Error(`Only path to a file or directory is supported: ${path}`);
  }

  const baseDirectory = stats.isDirectory() ? path : dirname(path);

  return validatePath(path, baseDirectory);
};

const main = async () => {
  logger.info(`PNG Converter`);

  const path = getWorkingDirectoryOrConfigFile();

  if (!optionsExists(path)) {
    logger.info(`Config file not found at '${path}'. Creating default config file.`);

    const options = getDefaultOptions();
    const stats = statSync(path);
    options.directory = stats.isDirectory() ? path : dirname(path);
    saveOptions(options, options.directory);

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Config file created with default options. Do you want to proceed with these options? (Convert to ${options.imageOptions.type}, quality ${options.imageOptions.quality}, ${options.deleteOriginal ? 'delete' : 'keep'} original files)`,
        default: true,
      },
    ]);
    if (!proceed) {
      logger.info('Please update the config file and restart the application.');
      await inquirer.prompt([{ type: 'input', name: 'exit', message: 'Press Enter to exit...' }]);
      process.exit(0);
    }
  }

  const options = loadOptions(path);

  const images = listImages(options.directory || path);

  if (images.length > 0) {
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Found ${images.length} images to convert to ${options.imageOptions.type}. Originals will be ${options.deleteOriginal ? 'deleted' : 'kept'}. Do you want to proceed with the conversion?`,
        default: true,
      },
    ]);

    if (proceed) {
      const result = await consumeList(images, options);
      logger.info(`Conversion finished. ${result.success} out of ${result.total} images converted successfully.`);
      if (result.errors.length > 0) {
        logger.warn(`Errors occurred during conversion:`);
        result.errors.forEach(err => logger.error(err));
      }
    }
  } else {
    logger.warn(`No suitable images found in '${options.directory}'.`);
  }

  await inquirer.prompt([{ type: 'input', name: 'exit', message: 'Press Enter to exit...' }]);
};

main().catch(err => {
  logger.error(`Error: ${err.message}`);
  inquirer
    .prompt([{ type: 'input', name: 'exit', message: 'Press Enter to exit...' }])
    .then(() => process.exit(1))
  ;
});
