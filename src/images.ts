import { readdirSync, statSync, unlinkSync, utimesSync } from 'fs';
import { extname, basename } from 'path';
import sharp from 'sharp';
import cliProgress from 'cli-progress';
import { Options } from './options';

const listImages = (directory: string): string[] => {
  const files = readdirSync(directory);
  return files.filter(file => ['.png'].includes(extname(file).toLowerCase()));
};

const convertImage = async (image: string, outputFile: string, imageOptions: Pick<Options, 'imageOptions'>): Promise<void> => {
  const { type, quality, maxWidth, maxHeight } = imageOptions.imageOptions;

  let transformer = sharp(image).toFormat(type, { quality });

  if (maxWidth || maxHeight) {
    transformer = transformer.resize(maxWidth, maxHeight, { fit: 'inside' });
  }

  await transformer.toFile(outputFile);
};

interface Result {
  total: number;
  success: number;
  errors: string[];
}

const consumeList = async (images: string[], options: Options): Promise<Result> => {
  const result: Result = {
    total: images.length,
    success: 0,
    errors: [],
  };
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(images.length, 0);

  for (const [index, image] of images.entries()) {
    try {
      const { atime, mtime } = statSync(image);
      const outputFile = image.replace(/\.[^/.]+$/, `.${options.imageOptions.type}`);

      await convertImage(image, outputFile, options);

      if (options.preserveAttributes) {
        utimesSync(outputFile, atime, mtime);
      }
      if (options.deleteOriginal) {
        unlinkSync(image);
      }

      progressBar.update(index + 1);
      result.success++;
    } catch (err) {
      if (options.careful) {
        progressBar.stop();
        throw err;
      } else {
        const e = err as Error;
        progressBar.increment();
        const filename = basename(image);
        result.errors.push(`${filename}: ${e.message}`);
      }
    }
  }

  progressBar.stop();

  return result;
};

export { listImages, consumeList };