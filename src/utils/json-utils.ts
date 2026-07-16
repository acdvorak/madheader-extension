import type { Edit, JSONPath } from 'jsonc-parser';
import {
  applyEdits,
  createScanner,
  findNodeAtLocation,
  modify,
  parse,
  parseTree,
} from 'jsonc-parser';
import prettier from 'prettier';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findCommaOffset(
  text: string,
  startOffset: number,
  endOffset: number,
): number | undefined {
  const scanner = createScanner(text, false);
  scanner.setPosition(startOffset);

  while (scanner.getPosition() < endOffset) {
    scanner.scan();
    const tokenOffset = scanner.getTokenOffset();
    if (text[tokenOffset] === ',') {
      return tokenOffset;
    }
  }

  return undefined;
}

function removeValuePreservingComments(text: string, path: JSONPath): string {
  const root = parseTree(text, undefined, {
    allowTrailingComma: true,
    disallowComments: false,
  });
  if (!root) {
    return text;
  }

  const valueNode = findNodeAtLocation(root, path);
  if (!valueNode) {
    return text;
  }

  const nodeToRemove =
    valueNode.parent?.type === 'property' ? valueNode.parent : valueNode;
  const container = nodeToRemove.parent;
  const siblings = container?.children;
  if (!container || !siblings) {
    return applyEdits(text, modify(text, path, undefined, {}));
  }

  const nodeIndex = siblings.indexOf(nodeToRemove);
  if (nodeIndex < 0) {
    return applyEdits(text, modify(text, path, undefined, {}));
  }

  const nodeEnd = nodeToRemove.offset + nodeToRemove.length;
  const nextNode = siblings[nodeIndex + 1];
  const afterNodeEnd =
    nextNode?.offset ?? container.offset + container.length - 1;
  let commaOffset = findCommaOffset(text, nodeEnd, afterNodeEnd);

  const previousNode = siblings[nodeIndex - 1];
  if (commaOffset === undefined && previousNode) {
    commaOffset = findCommaOffset(
      text,
      previousNode.offset + previousNode.length,
      nodeToRemove.offset,
    );
  }

  const edits: Edit[] = [
    {
      offset: nodeToRemove.offset,
      length: nodeToRemove.length,
      content: '',
    },
  ];
  if (commaOffset !== undefined) {
    edits.push({ offset: commaOffset, length: 1, content: '' });
  }

  return applyEdits(text, edits);
}

function applyValueEdit(text: string, path: JSONPath, value: unknown): string {
  if (value === undefined) {
    return removeValuePreservingComments(text, path);
  }

  return applyEdits(text, modify(text, path, value, {}));
}

function reconcileJsoncValue(
  text: string,
  currentValue: unknown,
  normalizedValue: unknown,
  path: JSONPath,
): string {
  if (Object.is(currentValue, normalizedValue)) {
    return text;
  }

  if (Array.isArray(currentValue) && Array.isArray(normalizedValue)) {
    let updatedText = text;
    const sharedLength = Math.min(currentValue.length, normalizedValue.length);

    for (let index = 0; index < sharedLength; index += 1) {
      updatedText = reconcileJsoncValue(
        updatedText,
        currentValue[index],
        normalizedValue[index],
        [...path, index],
      );
    }

    for (
      let index = currentValue.length - 1;
      index >= normalizedValue.length;
      index -= 1
    ) {
      updatedText = applyValueEdit(updatedText, [...path, index], undefined);
    }

    for (
      let index = currentValue.length;
      index < normalizedValue.length;
      index += 1
    ) {
      updatedText = applyValueEdit(
        updatedText,
        [...path, index],
        normalizedValue[index],
      );
    }

    return updatedText;
  }

  if (isJsonObject(currentValue) && isJsonObject(normalizedValue)) {
    let updatedText = text;

    for (const key of Object.keys(currentValue)) {
      if (!Object.hasOwn(normalizedValue, key)) {
        updatedText = applyValueEdit(updatedText, [...path, key], undefined);
      }
    }

    for (const [key, value] of Object.entries(normalizedValue)) {
      if (Object.hasOwn(currentValue, key)) {
        updatedText = reconcileJsoncValue(
          updatedText,
          currentValue[key],
          value,
          [...path, key],
        );
      } else {
        updatedText = applyValueEdit(updatedText, [...path, key], value);
      }
    }

    return updatedText;
  }

  return applyValueEdit(text, path, normalizedValue);
}

export async function formatJsonWithComments(thing: unknown): Promise<string> {
  const unformatted =
    typeof thing === 'string' ? thing : JSON.stringify(thing, null, 2);

  // Pass the raw JSONC string directly to Prettier.
  // It formats syntax and inserts commas without touching or erasing comments.
  const formatted = await prettier.format(unformatted, {
    parser: 'jsonc', // Explicitly targets JSON with comments
    trailingComma: 'all', // Enforces trailing commas everywhere
    tabWidth: 2, // Match your preferred indent style
    plugins: [babelPlugin, estreePlugin],
  });

  return formatted;
}

export async function formatNormalizedJsoncWithComments(
  text: string,
  normalizedValue: unknown,
): Promise<string> {
  const currentValue = parse(text, undefined, {
    allowTrailingComma: true,
    disallowComments: false,
  }) as unknown;
  const reconciledText = reconcileJsoncValue(
    text,
    currentValue,
    normalizedValue,
    [],
  );

  return formatJsonWithComments(reconciledText);
}
