import chokidar from 'chokidar';
import { ValidatedOptions } from './options';
import { consumeList, isSupportedFile } from './images';
import logger from './logger';

const watchDirectory = (options: ValidatedOptions) => {
  const watcher = chokidar.watch(options.directory, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    depth: options.deep ? 4 : 0, // limit the depth to 4 if deep is enabled
  });

  watcher.on('add', async (path) => {
    if (isSupportedFile(path)) {
      try {
        const result = await consumeList([path], options);
        if (result.success > 0) {
          logger.info(`Converted: ${path}`);
        }
        if (result.errors.length > 0) {
          logger.warn(`Errors occurred during conversion:`);
          result.errors.forEach(err => logger.error(err));
        }
      } catch (err) {
        logger.error(`Error converting ${path}: ${(err as Error).message}`);
      }
    }
  });

  watcher.on('error', (error) => logger.error(`Watcher error: ${error}`));

  logger.info(`Watching directory${options.deep ? ' (and subdirectories)' : ''}: ${options.directory}`);

  return watcher;
};

export { watchDirectory };
