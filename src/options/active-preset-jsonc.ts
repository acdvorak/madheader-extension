import { applyEdits, modify } from 'jsonc-parser';

import prettierConfig from '@/prettier-config.mts';
import type { PresetId } from '@/schemas/config-schema';

export function replaceActivePresetJsonc(
  text: string,
  activePreset: PresetId | null,
): string | null {
  try {
    const edits = modify(text, ['activePreset'], activePreset, {
      formattingOptions: {
        insertSpaces: !(prettierConfig.useTabs ?? false),
        tabSize: prettierConfig.tabWidth ?? 2,
        eol: text.includes('\r\n') ? '\r\n' : '\n',
      },
    });

    return edits.length === 0 ? text : applyEdits(text, edits);
  } catch {
    return null;
  }
}
