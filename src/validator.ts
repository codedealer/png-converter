import Ajv, { JSONSchemaType } from 'ajv';
import { Options } from './options';

const ajv = new Ajv();

const optionsSchema: JSONSchemaType<Options> = {
  type: 'object',
  properties: {
    directory: { type: 'string', nullable: true },
    deleteOriginal: { type: 'boolean' },
    preserveAttributes: { type: 'boolean' },
    careful: { type: 'boolean' },
    deep: { type: 'boolean' },
    watch: { type: 'boolean' },
    imageOptions: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['jpg', 'webp'] },
        quality: { type: 'number' },
        maxWidth: { type: 'number', nullable: true },
        maxHeight: { type: 'number', nullable: true },
      },
      required: ['type', 'quality'],
    },
  },
  required: ['deleteOriginal', 'preserveAttributes', 'careful', 'deep', 'imageOptions', 'watch'],
  additionalProperties: false,
};

const validateOptions = (data: unknown): data is Options => {
  const validate = ajv.compile(optionsSchema);
  if (validate(data)) {
    return true;
  } else {
    console.error(validate.errors);
    return false;
  }
};

export { validateOptions };
