import type { MadConfig } from '@/schemas/config-schema';
import {
  compilePresetMatchers,
  isUrlMatchedByPreset,
} from '@/services/config/url-matcher';

export const ACTIVE_TOOLBAR_ICON_PATH = {
  '16': 'icons/madheader-icon-v2-16.png',
  '32': 'icons/madheader-icon-v2-32.png',
} as const;
export const INACTIVE_TOOLBAR_ICON_PATH = {
  '16': 'icons/madheader-icon-v2-grayscale-16.png',
  '32': 'icons/madheader-icon-v2-grayscale-32.png',
} as const;

export interface ToolbarIconState {
  iconPath: Readonly<Record<string, string>>;
  badgeText: string;
}

export function getToolbarIconState(
  config: MadConfig,
  url: string | undefined,
): ToolbarIconState {
  const activePreset = config.presets.find((preset) => {
    return !preset.disabled && preset.id === config.activePreset;
  });

  if (!activePreset) {
    return {
      iconPath: INACTIVE_TOOLBAR_ICON_PATH,
      badgeText: '',
    };
  }

  const matches =
    url !== undefined &&
    isUrlMatchedByPreset(url, compilePresetMatchers(activePreset));

  return {
    iconPath: ACTIVE_TOOLBAR_ICON_PATH,
    badgeText: matches
      ? String(Object.keys(activePreset.reqHeaders).length)
      : '',
  };
}
