import { describe, expect, it } from 'vitest';

import { generateConfigJsonSchema } from './json-schema';

interface JsonSchemaNode extends Record<string, unknown> {
  items?: JsonSchemaNode;
  properties?: Record<string, JsonSchemaNode>;
}

function getRequestHeaderSchema(
  customRequestHeaderNames: Iterable<string> = [],
): Record<string, unknown> {
  const schema = generateConfigJsonSchema(
    customRequestHeaderNames,
  ) as JsonSchemaNode;
  const requestHeaderSchema =
    schema.properties?.['presets']?.items?.properties?.['reqHeaders'];
  if (!requestHeaderSchema) {
    throw new Error('Generated schema is missing the request header map');
  }

  return requestHeaderSchema;
}

function getImageIdSchema(
  savedImageIds: Iterable<string> = [],
): Record<string, unknown> {
  const schema = generateConfigJsonSchema([], savedImageIds) as JsonSchemaNode;
  const imageIdSchema =
    schema.properties?.['presets']?.items?.properties?.['imageId'];
  if (!imageIdSchema) {
    throw new Error('Generated schema is missing the image ID field');
  }

  return imageIdSchema;
}

describe('config JSON Schema', () => {
  it('adds custom request header names as property suggestions', () => {
    const requestHeaders = getRequestHeaderSchema([
      'X-Foo-Bar',
      'X-Other-Header',
      'X-Foo-Bar',
    ]);

    expect(requestHeaders['properties']).toMatchObject({
      'X-Foo-Bar': { type: 'string' },
      'X-Other-Header': { type: 'string' },
    });
    expect(requestHeaders['additionalProperties']).toEqual({ type: 'string' });
  });

  it('preserves the schema for known request headers', () => {
    const requestHeaders = getRequestHeaderSchema(['Authorization']);
    const properties = requestHeaders['properties'] as Record<
      string,
      Record<string, unknown>
    >;

    expect(properties['Authorization']?.['type']).toBe('string');
    expect(properties['Authorization']?.['description']).toContain(
      'credentials',
    );
  });

  it('constrains image IDs to saved images while preserving null', () => {
    expect(
      getImageIdSchema(['avatar.png', 'logo.svg', 'avatar.png']),
    ).toMatchObject({
      anyOf: [
        {
          type: 'string',
          minLength: 1,
          enum: ['avatar.png', 'logo.svg'],
        },
        { type: 'null' },
      ],
    });
  });

  it('rejects every non-null image ID when no images are saved', () => {
    expect(getImageIdSchema()).toMatchObject({
      anyOf: [{ type: 'string', not: {} }, { type: 'null' }],
    });
  });
});
