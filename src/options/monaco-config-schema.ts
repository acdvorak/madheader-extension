import type { JSONPath, Node } from 'jsonc-parser';
import {
  findNodeAtLocation,
  findNodeAtOffset,
  getNodePath,
  getNodeValue,
  parseTree,
} from 'jsonc-parser';
import type MonacoEditorNs from 'monaco-editor';

import { findDuplicatePresetIds, PresetName } from '../schemas/config-schema';
import { KnownHttpRequestHeaderName } from '../schemas/known-http-headers';
import { parseAndNormalizeConfigJsonc } from '../services/config/config-persistence';
import { generateConfigJsonSchema } from '../services/config/json-schema';
import { matchPattern } from '../utils/match-pattern';

export const OPTIONS_CONFIG_MODEL_URI =
  'inmemory://model/madheader-config.jsonc';

const CONFIG_SCHEMA_URI = 'madheader://schema/config.schema.json';
const ZOD_MARKER_OWNER = 'zod-validation';

const knownRequestHeaderNames = new Set(
  KnownHttpRequestHeaderName.options.map((name) => name.toLowerCase()),
);

const HTTP_FIELD_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

type Monaco = typeof MonacoEditorNs;

interface MonacoJsonDefaultsLike {
  setDiagnosticsOptions: (options: MonacoJsonDiagnosticsOptions) => void;
}

interface MonacoJsonDiagnosticsOptions {
  validate: boolean;
  allowComments: boolean;
  trailingCommas: 'ignore' | 'error';
  schemaValidation: 'error';
  enableSchemaRequest: boolean;
  schemas: Array<{
    uri: string;
    fileMatch: string[];
    schema: Record<string, unknown>;
  }>;
}

function isGlobExpressionPath(path: JSONPath): boolean {
  return (
    path.length === 5 &&
    path[0] === 'presets' &&
    typeof path[1] === 'number' &&
    (path[2] === 'include' || path[2] === 'exclude') &&
    path[3] === 'globs' &&
    typeof path[4] === 'number'
  );
}

export function registerGlobExpressionHoverProvider(
  monaco: Monaco,
): MonacoEditorNs.IDisposable {
  return monaco.languages.registerHoverProvider('json', {
    provideHover(model, position) {
      if (model.uri.toString() !== OPTIONS_CONFIG_MODEL_URI) {
        return undefined;
      }

      const root = parseTree(model.getValue(), [], {
        allowTrailingComma: true,
        disallowComments: false,
      });
      const node = root
        ? findNodeAtOffset(root, model.getOffsetAt(position), true)
        : undefined;
      if (
        node?.type !== 'string' ||
        typeof node.value !== 'string' ||
        !isGlobExpressionPath(getNodePath(node))
      ) {
        return undefined;
      }

      const matcher = matchPattern(node.value.trim());
      if (!matcher.valid) {
        return undefined;
      }

      const examples = matcher.examples;
      if (examples.length === 0) {
        return undefined;
      }

      const startPosition = model.getPositionAt(node.offset);
      const endPosition = model.getPositionAt(node.offset + node.length);

      return {
        range: {
          startLineNumber: startPosition.lineNumber,
          startColumn: startPosition.column,
          endLineNumber: endPosition.lineNumber,
          endColumn: endPosition.column,
        },
        contents: [
          {
            value: [
              '**Example matching URLs**:',
              '',
              ...examples.map((example) => `- \`${example}\``),
            ].join('\n'),
          },
        ],
      };
    },
  });
}

function findClosestNode(root: Node, path: JSONPath): Node {
  for (let pathLength = path.length; pathLength >= 0; pathLength -= 1) {
    const node = findNodeAtLocation(root, path.slice(0, pathLength));
    if (node) {
      return node;
    }
  }

  return root;
}

function getRawPresets(root: Node | undefined): unknown {
  const config = root ? (getNodeValue(root) as unknown) : undefined;
  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    return undefined;
  }

  return Reflect.get(config, 'presets');
}

export function collectCustomRequestHeaderNames(text: string): string[] {
  const root = parseTree(text, [], {
    allowTrailingComma: true,
    disallowComments: false,
  });
  const presets = getRawPresets(root);
  if (!Array.isArray(presets)) {
    return [];
  }

  const namesByLowercase = new Map<string, string>();
  for (const preset of presets) {
    if (preset == null || typeof preset !== 'object' || Array.isArray(preset)) {
      continue;
    }

    const requestHeaders = Reflect.get(preset, 'reqHeaders') as unknown;
    if (
      requestHeaders == null ||
      typeof requestHeaders !== 'object' ||
      Array.isArray(requestHeaders)
    ) {
      continue;
    }

    for (const rawName of Object.keys(requestHeaders)) {
      const name = rawName.trim();
      const lowercaseName = name.toLowerCase();
      if (
        !name ||
        knownRequestHeaderNames.has(lowercaseName) ||
        namesByLowercase.has(lowercaseName)
      ) {
        continue;
      }

      namesByLowercase.set(lowercaseName, name);
    }
  }

  return Array.from(namesByLowercase.values()).sort((left, right) =>
    left.localeCompare(right),
  );
}

interface DuplicatePresetName {
  name: PresetName;
  presetIndexes: number[];
}

function findPresetsWithoutIncludePatterns(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((preset, presetIndex) => {
    if (preset == null || typeof preset !== 'object' || Array.isArray(preset)) {
      return [];
    }

    const include = Reflect.get(preset, 'include') as unknown;
    if (
      include != null &&
      typeof include === 'object' &&
      !Array.isArray(include)
    ) {
      const globs = Reflect.get(include, 'globs') as unknown;
      const regexes = Reflect.get(include, 'regexes') as unknown;
      if (
        (Array.isArray(globs) && globs.length > 0) ||
        (Array.isArray(regexes) && regexes.length > 0)
      ) {
        return [];
      }
    }

    return [presetIndex];
  });
}

function findDuplicatePresetNames(value: unknown): DuplicatePresetName[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const namesByLowercase = new Map<string, DuplicatePresetName>();
  value.forEach((preset, presetIndex) => {
    if (preset == null || typeof preset !== 'object' || Array.isArray(preset)) {
      return;
    }

    const result = PresetName.safeParse(Reflect.get(preset, 'name'));
    if (!result.success) {
      return;
    }

    const lowercaseName = result.data.toLowerCase();
    const duplicateName = namesByLowercase.get(lowercaseName);
    if (duplicateName) {
      duplicateName.presetIndexes.push(presetIndex);
    } else {
      namesByLowercase.set(lowercaseName, {
        name: result.data,
        presetIndexes: [presetIndex],
      });
    }
  });

  return Array.from(namesByLowercase.values()).filter(
    ({ presetIndexes }) => presetIndexes.length > 1,
  );
}

interface RequestHeaderNameIssue {
  message: string;
  node: Node;
}

function findRequestHeaderNameIssues(
  root: Node | undefined,
): RequestHeaderNameIssue[] {
  const presetsNode = root ? findNodeAtLocation(root, ['presets']) : undefined;
  if (presetsNode?.type !== 'array') {
    return [];
  }

  const issues: RequestHeaderNameIssue[] = [];
  for (const [presetIndex, presetNode] of (
    presetsNode.children ?? []
  ).entries()) {
    const requestHeadersNode = findNodeAtLocation(presetNode, ['reqHeaders']);
    if (requestHeadersNode?.type !== 'object') {
      continue;
    }

    const namesByLowercase = new Map<
      string,
      Array<{ name: string; node: Node }>
    >();
    for (const propertyNode of requestHeadersNode.children ?? []) {
      const nameNode = propertyNode.children?.[0];
      if (nameNode?.type !== 'string' || typeof nameNode.value !== 'string') {
        continue;
      }

      const name = nameNode.value;
      if (!HTTP_FIELD_NAME_PATTERN.test(name)) {
        issues.push({
          message: `Invalid HTTP/1.1 request header name "${name}". Header names may contain only letters, digits, and !#$%&'*+-.^_\`|~.`,
          node: nameNode,
        });
      }

      const lowercaseName = name.toLowerCase();
      const names = namesByLowercase.get(lowercaseName) ?? [];
      names.push({ name, node: nameNode });
      namesByLowercase.set(lowercaseName, names);
    }

    for (const names of namesByLowercase.values()) {
      if (names.length < 2 || new Set(names.map(({ name }) => name)).size < 2) {
        continue;
      }

      for (const { name, node } of names) {
        issues.push({
          message: `Duplicate request header name "${name}" in preset ${presetIndex + 1}. Header names are compared case-insensitively.`,
          node,
        });
      }
    }
  }

  return issues;
}

export function updateMonacoZodValidationMarkers(
  monaco: Monaco,
  model: MonacoEditorNs.editor.ITextModel,
): void {
  const result = parseAndNormalizeConfigJsonc(model.getValue());
  const customErrors = result.ok
    ? []
    : result.errors.filter((error) => error.isCustomValidation);
  const root = parseTree(model.getValue(), [], {
    allowTrailingComma: true,
    disallowComments: false,
  });

  const customErrorMarkers: MonacoEditorNs.editor.IMarkerData[] =
    customErrors.map((error) => {
      const node = root
        ? findClosestNode(root, error.jsonPath ?? [])
        : undefined;
      const startPosition = model.getPositionAt(node?.offset ?? 0);
      const endPosition = model.getPositionAt(
        (node?.offset ?? 0) + (node?.length ?? 1),
      );

      return {
        severity: monaco.MarkerSeverity.Error,
        message: error.message,
        source: 'Zod',
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column,
      };
    });

  const duplicateIdMarkers: MonacoEditorNs.editor.IMarkerData[] =
    findDuplicatePresetIds(getRawPresets(root)).flatMap(
      ({ id, presetIndexes }) =>
        presetIndexes.map((presetIndex) => {
          const idPath: JSONPath = ['presets', presetIndex, 'id'];
          const path =
            root && findNodeAtLocation(root, idPath)
              ? idPath
              : ['presets', presetIndex, 'name'];
          const node = root ? findClosestNode(root, path) : undefined;
          const startPosition = model.getPositionAt(node?.offset ?? 0);
          const endPosition = model.getPositionAt(
            (node?.offset ?? 0) + (node?.length ?? 1),
          );

          return {
            severity: monaco.MarkerSeverity.Error,
            message: `Duplicate preset ID "${id}". It will be renamed automatically when the configuration is saved.`,
            source: 'Zod',
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: endPosition.lineNumber,
            endColumn: endPosition.column,
          };
        }),
    );

  const duplicateNameMarkers: MonacoEditorNs.editor.IMarkerData[] =
    findDuplicatePresetNames(getRawPresets(root)).flatMap(
      ({ name, presetIndexes }) =>
        presetIndexes.map((presetIndex) => {
          const node = root
            ? findClosestNode(root, ['presets', presetIndex, 'name'])
            : undefined;
          const startPosition = model.getPositionAt(node?.offset ?? 0);
          const endPosition = model.getPositionAt(
            (node?.offset ?? 0) + (node?.length ?? 1),
          );

          return {
            severity: monaco.MarkerSeverity.Warning,
            message: `Duplicate preset name "${name}". Preset names are compared case-insensitively.`,
            source: 'Zod',
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: endPosition.lineNumber,
            endColumn: endPosition.column,
          };
        }),
    );

  const missingIncludeMarkers: MonacoEditorNs.editor.IMarkerData[] =
    findPresetsWithoutIncludePatterns(getRawPresets(root)).map(
      (presetIndex) => {
        const includePath: JSONPath = ['presets', presetIndex, 'include'];
        const path =
          root && findNodeAtLocation(root, includePath)
            ? includePath
            : ['presets', presetIndex, 'name'];
        const node = root ? findClosestNode(root, path) : undefined;
        const startPosition = model.getPositionAt(node?.offset ?? 0);
        const endPosition = model.getPositionAt(
          (node?.offset ?? 0) + (node?.length ?? 1),
        );

        return {
          severity: monaco.MarkerSeverity.Warning,
          message:
            'This preset has no include patterns and will not match any URLs.',
          source: 'Zod',
          startLineNumber: startPosition.lineNumber,
          startColumn: startPosition.column,
          endLineNumber: endPosition.lineNumber,
          endColumn: endPosition.column,
        };
      },
    );

  const requestHeaderNameMarkers: MonacoEditorNs.editor.IMarkerData[] =
    findRequestHeaderNameIssues(root).map(({ message, node }) => {
      const startPosition = model.getPositionAt(node.offset);
      const endPosition = model.getPositionAt(node.offset + node.length);

      return {
        severity: monaco.MarkerSeverity.Error,
        message,
        source: 'Zod',
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column,
      };
    });

  monaco.editor.setModelMarkers(model, ZOD_MARKER_OWNER, [
    ...customErrorMarkers,
    ...duplicateIdMarkers,
    ...duplicateNameMarkers,
    ...missingIncludeMarkers,
    ...requestHeaderNameMarkers,
  ]);
}

export function configureMonacoConfigSchema(
  monaco: Monaco,
  customRequestHeaderNames: Iterable<string> = [],
  savedImageIds: Iterable<string> = [],
): void {
  const jsonDefaults = (
    monaco.languages as unknown as {
      json: {
        jsonDefaults: MonacoJsonDefaultsLike;
      };
    }
  ).json.jsonDefaults;

  jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    trailingCommas: 'ignore',
    schemaValidation: 'error',
    enableSchemaRequest: false,
    schemas: [
      {
        uri: CONFIG_SCHEMA_URI,
        fileMatch: [OPTIONS_CONFIG_MODEL_URI],
        schema: generateConfigJsonSchema(
          customRequestHeaderNames,
          savedImageIds,
        ),
      },
    ],
  });
}
