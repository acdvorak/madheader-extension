import type MonacoEditorNs from 'monaco-editor';
import { describe, expect, it, vi } from 'vitest';

import {
  collectCustomRequestHeaderNames,
  configureMonacoConfigSchema,
  OPTIONS_CONFIG_MODEL_URI,
  registerGlobExpressionHoverProvider,
  updateMonacoZodValidationMarkers,
} from './monaco-config-schema';

function positionAt(
  text: string,
  offset: number,
): { column: number; lineNumber: number } {
  const precedingText = text.slice(0, offset);
  const lines = precedingText.split('\n');

  return {
    column: (lines.at(-1)?.length ?? 0) + 1,
    lineNumber: lines.length,
  };
}

describe('Monaco config schema', () => {
  it('collects custom request header names across presets', () => {
    const text = `{
  "presets": [
    {
      "reqHeaders": {
        "X-Foo-Bar": "true",
        "Authorization": "token"
      }
    },
    {
      "reqHeaders": {
        "x-foo-bar": "false",
        "X-Other-Header": "value"
      }
    }
  ]
}`;

    expect(collectCustomRequestHeaderNames(text)).toEqual([
      'X-Foo-Bar',
      'X-Other-Header',
    ]);
  });

  it('adds dynamic request header names and image IDs to Monaco suggestions', () => {
    const setDiagnosticsOptions = vi.fn();
    const monaco = {
      languages: { json: { jsonDefaults: { setDiagnosticsOptions } } },
    } as unknown as typeof MonacoEditorNs;

    configureMonacoConfigSchema(
      monaco,
      ['X-Foo-Bar'],
      ['avatar.png', 'logo.svg'],
    );

    expect(setDiagnosticsOptions).toHaveBeenCalledOnce();
    const options = setDiagnosticsOptions.mock.calls[0]?.[0] as {
      schemas: Array<{ schema: Record<string, unknown> }>;
    };
    expect(options.schemas[0]?.schema).toMatchObject({
      properties: {
        presets: {
          items: {
            properties: {
              reqHeaders: {
                properties: { 'X-Foo-Bar': { type: 'string' } },
                additionalProperties: { type: 'string' },
              },
              imageId: {
                anyOf: [
                  { type: 'string', enum: ['avatar.png', 'logo.svg'] },
                  { type: 'null' },
                ],
              },
            },
          },
        },
      },
    });
  });
});

describe('Monaco glob expression hover', () => {
  function createHoverProvider(): MonacoEditorNs.languages.HoverProvider {
    let provider: MonacoEditorNs.languages.HoverProvider | undefined;
    const registerHoverProvider = vi.fn(
      (
        _languageSelector: MonacoEditorNs.languages.LanguageSelector,
        hoverProvider: MonacoEditorNs.languages.HoverProvider,
      ) => {
        provider = hoverProvider;
        return { dispose: vi.fn() };
      },
    );
    const monaco = {
      languages: { registerHoverProvider },
    } as unknown as typeof MonacoEditorNs;

    registerGlobExpressionHoverProvider(monaco);

    expect(registerHoverProvider).toHaveBeenCalledOnce();
    expect(registerHoverProvider).toHaveBeenCalledWith(
      'json',
      expect.any(Object),
    );
    if (!provider) {
      throw new Error('Glob expression hover provider was not registered');
    }

    return provider;
  }

  function createModel(
    text: string,
    hoverOffset: number,
    uri = OPTIONS_CONFIG_MODEL_URI,
  ): MonacoEditorNs.editor.ITextModel {
    return {
      getOffsetAt: () => hoverOffset,
      getPositionAt: (offset: number) => positionAt(text, offset),
      getValue: () => text,
      uri: { toString: () => uri },
    } as unknown as MonacoEditorNs.editor.ITextModel;
  }

  function createPosition(
    text: string,
    offset: number,
  ): MonacoEditorNs.Position {
    return positionAt(text, offset) as unknown as MonacoEditorNs.Position;
  }

  it('shows matching URL examples for a valid normalized glob value', () => {
    const text = `{
  "presets": [{
    "include": { "globs": ["*.example.com"] }
  }]
}`;
    const hoverOffset = text.indexOf('*.example.com') + 2;
    const provider = createHoverProvider();
    const hover = provider.provideHover(
      createModel(text, hoverOffset),
      createPosition(text, hoverOffset),
      {} as MonacoEditorNs.CancellationToken,
    ) as MonacoEditorNs.languages.Hover | undefined;

    expect(hover?.contents[0]?.value).toContain('**Example matching URLs**');
    expect(hover?.contents[0]?.value).toContain('- `http://www.example.com/`');
    expect(hover?.contents[0]?.value).toContain(
      '- `https://foo.bar.example.com/bar/baz/`',
    );
  });

  it('does not provide examples for an invalid glob value', () => {
    const text = `{
  "presets": [{
    "include": { "globs": ["http://[invalid"] }
  }]
}`;
    const hoverOffset = text.indexOf('http://[invalid') + 2;
    const provider = createHoverProvider();

    expect(
      provider.provideHover(
        createModel(text, hoverOffset),
        createPosition(text, hoverOffset),
        {} as MonacoEditorNs.CancellationToken,
      ),
    ).toBeUndefined();
  });

  it('does not provide examples for strings outside a globs array', () => {
    const text = `{
  "presets": [{
    "name": "*.example.com"
  }]
}`;
    const hoverOffset = text.indexOf('*.example.com') + 2;
    const provider = createHoverProvider();

    expect(
      provider.provideHover(
        createModel(text, hoverOffset),
        createPosition(text, hoverOffset),
        {} as MonacoEditorNs.CancellationToken,
      ),
    ).toBeUndefined();
  });
});

describe('Monaco config validation markers', () => {
  it('does not throw while an empty preset name is being edited', () => {
    const text = `{
  "presets": [{ "id": "", "name": "" }]
}`;
    const setModelMarkers = vi.fn();
    const model = {
      getPositionAt: (offset: number) => positionAt(text, offset),
      getValue: () => text,
    } as MonacoEditorNs.editor.ITextModel;
    const monaco = {
      MarkerSeverity: { Error: 8, Warning: 4 },
      editor: { setModelMarkers },
    } as unknown as typeof MonacoEditorNs;

    expect(() => {
      updateMonacoZodValidationMarkers(monaco, model);
    }).not.toThrow();
    expect(setModelMarkers).toHaveBeenCalledOnce();
  });

  it('marks every preset with a duplicate normalized ID', () => {
    const text = `{
  "presets": [
    {
      "id": " Shared ID ",
      "name": "First preset"
    },
    {
      "id": "shared_id",
      "name": "Second preset"
    }
  ]
}`;
    const setModelMarkers = vi.fn();
    const model = {
      getPositionAt: (offset: number) => positionAt(text, offset),
      getValue: () => text,
    } as MonacoEditorNs.editor.ITextModel;
    const monaco = {
      MarkerSeverity: { Error: 8, Warning: 4 },
      editor: { setModelMarkers },
    } as unknown as typeof MonacoEditorNs;

    updateMonacoZodValidationMarkers(monaco, model);

    expect(setModelMarkers).toHaveBeenCalledOnce();
    const markers = (
      setModelMarkers.mock.calls[0]?.[2] as MonacoEditorNs.editor.IMarkerData[]
    ).filter(({ message }) => message.includes('Duplicate preset ID'));
    expect(markers).toHaveLength(2);
    expect(markers.map(({ startLineNumber }) => startLineNumber)).toEqual([
      4, 8,
    ]);
    expect(
      markers
        .map(({ message }) => message)
        .every((message) =>
          message.includes('Duplicate preset ID "shared-id"'),
        ),
    ).toBe(true);
  });

  it('marks names when duplicate IDs are derived', () => {
    const text = `{
  "presets": [
    { "name": "Shared preset" },
    { "name": "Shared preset" }
  ]
}`;
    const setModelMarkers = vi.fn();
    const model = {
      getPositionAt: (offset: number) => positionAt(text, offset),
      getValue: () => text,
    } as MonacoEditorNs.editor.ITextModel;
    const monaco = {
      MarkerSeverity: { Error: 8, Warning: 4 },
      editor: { setModelMarkers },
    } as unknown as typeof MonacoEditorNs;

    updateMonacoZodValidationMarkers(monaco, model);

    const markers = setModelMarkers.mock
      .calls[0]?.[2] as MonacoEditorNs.editor.IMarkerData[];
    const duplicateIdMarkers = markers.filter(
      ({ severity }) => severity === monaco.MarkerSeverity.Error,
    );
    expect(duplicateIdMarkers).toHaveLength(2);
    expect(
      duplicateIdMarkers.map(({ startLineNumber }) => startLineNumber),
    ).toEqual([3, 4]);
  });

  it('warns on every case-insensitive duplicate preset name', () => {
    const text = `{
  "presets": [
    { "id": "first", "name": "Shared preset" },
    { "id": "second", "name": " shared PRESET " }
  ]
}`;
    const setModelMarkers = vi.fn();
    const model = {
      getPositionAt: (offset: number) => positionAt(text, offset),
      getValue: () => text,
    } as MonacoEditorNs.editor.ITextModel;
    const monaco = {
      MarkerSeverity: { Error: 8, Warning: 4 },
      editor: { setModelMarkers },
    } as unknown as typeof MonacoEditorNs;

    updateMonacoZodValidationMarkers(monaco, model);

    const markers = (
      setModelMarkers.mock.calls[0]?.[2] as MonacoEditorNs.editor.IMarkerData[]
    ).filter(({ message }) => message.includes('Duplicate preset name'));
    expect(markers).toHaveLength(2);
    expect(markers.map(({ severity }) => severity)).toEqual([4, 4]);
    expect(markers.map(({ startLineNumber }) => startLineNumber)).toEqual([
      3, 4,
    ]);
    expect(
      markers.every(({ message }) =>
        message.includes('Preset names are compared case-insensitively'),
      ),
    ).toBe(true);
  });

  it('warns on presets without include patterns', () => {
    const text = `{
  "presets": [
    { "id": "empty", "name": "Empty", "include": { "globs": [] } },
    { "id": "omitted", "name": "Omitted" },
    { "id": "glob", "name": "Glob", "include": { "globs": ["<all_urls>"] } },
    { "id": "regex", "name": "Regex", "include": { "regexes": ["https://"] } }
  ]
}`;
    const setModelMarkers = vi.fn();
    const model = {
      getPositionAt: (offset: number) => positionAt(text, offset),
      getValue: () => text,
    } as MonacoEditorNs.editor.ITextModel;
    const monaco = {
      MarkerSeverity: { Error: 8, Warning: 4 },
      editor: { setModelMarkers },
    } as unknown as typeof MonacoEditorNs;

    updateMonacoZodValidationMarkers(monaco, model);

    const markers = setModelMarkers.mock
      .calls[0]?.[2] as MonacoEditorNs.editor.IMarkerData[];
    expect(markers).toHaveLength(2);
    expect(markers.map(({ severity }) => severity)).toEqual([4, 4]);
    expect(markers.map(({ startLineNumber }) => startLineNumber)).toEqual([
      3, 4,
    ]);
    expect(
      markers.every(({ message }) =>
        message.includes('will not match any URLs'),
      ),
    ).toBe(true);
  });

  it('marks invalid and case-insensitively duplicate request header names', () => {
    const text = `{
  "presets": [
    {
      "id": "headers",
      "name": "Headers",
      "reqHeaders": {
        "X Invalid": "space",
        "foo": "lowercase",
        "FOO": "uppercase",
        "x-valid!#$%&'*+-.^_\u0060|~": "valid"
      },
      "include": { "globs": ["<all_urls>"] }
    }
  ]
}`;
    const setModelMarkers = vi.fn();
    const model = {
      getPositionAt: (offset: number) => positionAt(text, offset),
      getValue: () => text,
    } as MonacoEditorNs.editor.ITextModel;
    const monaco = {
      MarkerSeverity: { Error: 8, Warning: 4 },
      editor: { setModelMarkers },
    } as unknown as typeof MonacoEditorNs;

    updateMonacoZodValidationMarkers(monaco, model);

    const markers = setModelMarkers.mock
      .calls[0]?.[2] as MonacoEditorNs.editor.IMarkerData[];
    const invalidNameMarkers = markers.filter(({ message }) =>
      message.includes('Invalid HTTP/1.1 request header name'),
    );
    expect(invalidNameMarkers).toHaveLength(1);
    expect(invalidNameMarkers[0]).toMatchObject({
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: 7,
      startColumn: 9,
      endLineNumber: 7,
      endColumn: 20,
    });

    const duplicateNameMarkers = markers.filter(({ message }) =>
      message.includes('Duplicate request header name'),
    );
    expect(duplicateNameMarkers).toHaveLength(2);
    expect(
      duplicateNameMarkers.map(({ startLineNumber }) => startLineNumber),
    ).toEqual([8, 9]);
    expect(
      duplicateNameMarkers.every(
        ({ severity }) => severity === monaco.MarkerSeverity.Error,
      ),
    ).toBe(true);
  });
});
