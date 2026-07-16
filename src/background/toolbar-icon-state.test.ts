import { describe, expect, it } from 'vitest';

import type { MadConfig as MadConfigType } from '@/schemas/config-schema';
import { MadConfig } from '@/schemas/config-schema';

import {
  ACTIVE_TOOLBAR_ICON_PATH,
  getToolbarIconState,
  INACTIVE_TOOLBAR_ICON_PATH,
} from './toolbar-icon-state';

function createConfig(
  activePreset: string | null = 'test',
  reqHeaders: Record<string, string> = {
    Authorization: 'Bearer token',
    'X-Test': 'enabled',
  },
): MadConfigType {
  return MadConfig.parse({
    activePreset,
    presets: [
      {
        id: 'test',
        name: 'Test',
        reqHeaders,
        include: { globs: ['https://example.com/*'] },
        exclude: { globs: ['https://example.com/private/*'] },
      },
    ],
  });
}

describe('getToolbarIconState', () => {
  it('uses the grayscale icon when no preset is active', () => {
    expect(
      getToolbarIconState(createConfig(null), 'https://example.com/page'),
    ).toEqual({
      iconPath: INACTIVE_TOOLBAR_ICON_PATH,
      badgeText: '',
    });
  });

  it.each([undefined, 'https://other.example/page'])(
    'uses the original icon without a badge when the URL is %s',
    (url) => {
      expect(getToolbarIconState(createConfig(), url)).toEqual({
        iconPath: ACTIVE_TOOLBAR_ICON_PATH,
        badgeText: '',
      });
    },
  );

  it('uses the original icon with the request header count when matched', () => {
    expect(
      getToolbarIconState(createConfig(), 'https://example.com/page'),
    ).toEqual({
      iconPath: ACTIVE_TOOLBAR_ICON_PATH,
      badgeText: '2',
    });
  });

  it('shows zero when a matched preset has no request headers', () => {
    expect(
      getToolbarIconState(createConfig('test', {}), 'https://example.com/page'),
    ).toEqual({
      iconPath: ACTIVE_TOOLBAR_ICON_PATH,
      badgeText: '0',
    });
  });

  it('does not show a badge when the URL is excluded', () => {
    expect(
      getToolbarIconState(createConfig(), 'https://example.com/private/page'),
    ).toEqual({
      iconPath: ACTIVE_TOOLBAR_ICON_PATH,
      badgeText: '',
    });
  });
});
