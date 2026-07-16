import z from 'zod';

import { MadConfig } from '../../schemas/config-schema';

interface MutableJsonSchema extends Record<string, unknown> {
  anyOf?: MutableJsonSchema[];
  enum?: unknown[];
  items?: MutableJsonSchema;
  not?: MutableJsonSchema;
  properties?: Record<string, MutableJsonSchema>;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function generateConfigJsonSchema(
  customRequestHeaderNames: Iterable<string> = [],
  savedImageIds: Iterable<string> = [],
) {
  const schema = z.toJSONSchema(MadConfig, {
    io: 'input',
    unrepresentable: 'any',
  });

  const imageIdSchema = (schema as MutableJsonSchema).properties?.[
    'presets'
  ]?.items?.properties?.['imageId']?.anyOf?.find(
    (candidate) => candidate['type'] === 'string',
  );
  if (imageIdSchema) {
    const imageIds = Array.from(new Set(savedImageIds));
    if (imageIds.length > 0) {
      imageIdSchema.enum = imageIds;
    } else {
      imageIdSchema.not = {};
    }
  }

  const requestHeaderProperties = (schema as MutableJsonSchema).properties?.[
    'presets'
  ]?.items?.properties?.['reqHeaders']?.properties;
  if (!requestHeaderProperties) {
    return schema;
  }

  for (const name of customRequestHeaderNames) {
    if (name && requestHeaderProperties[name] === undefined) {
      requestHeaderProperties[name] = { type: 'string' };
    }
  }

  return schema;
}
