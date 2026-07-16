import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MadConfig } from '@/schemas/config-schema';
import {
  loadEditorConfigJsonc,
  saveConfig,
} from '@/services/config/config-persistence';
import { loadStoredImages } from '@/services/storage/image-storage';

import { loadPopupPresetList } from './preset-toggle';

vi.mock('@/services/config/config-persistence', () => ({
  loadEditorConfigJsonc: vi.fn(),
  saveConfig: vi.fn(),
}));

vi.mock('@/services/storage/image-storage', () => ({
  loadStoredImages: vi.fn(),
}));

const queryTabs = vi.fn();

describe('popup preset list', () => {
  beforeEach(() => {
    vi.mocked(saveConfig).mockReset();
    vi.mocked(loadEditorConfigJsonc).mockReset();
    vi.mocked(loadStoredImages).mockReset();
    queryTabs.mockReset();
    queryTabs.mockResolvedValue([{ url: 'https://example.com/current-page' }]);
    vi.stubGlobal('chrome', {
      tabs: {
        query: queryTabs,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves preset image IDs from local image storage', async () => {
    const config = MadConfig.parse({
      activePreset: 'first',
      presets: [
        { id: 'first', name: 'First', imageId: 'avatar.png' },
        { id: 'second', name: 'Second', imageId: 'missing.png' },
        { id: 'disabled', name: 'Disabled', disabled: true },
      ],
    });
    vi.mocked(loadEditorConfigJsonc).mockResolvedValue({
      jsonc: '{}',
      source: 'sync',
      config,
    });
    vi.mocked(loadStoredImages).mockResolvedValue({
      images: [
        {
          id: 'avatar.png',
          base64Bytes: 'aGVsbG8=',
          mimeType: 'image/png',
        },
      ],
    });

    await expect(loadPopupPresetList()).resolves.toMatchObject({
      activePresetId: 'first',
      presets: [
        {
          id: 'first',
          matchesCurrentPage: false,
          image: {
            id: 'avatar.png',
            base64Bytes: 'aGVsbG8=',
            mimeType: 'image/png',
          },
        },
        { id: 'second', image: undefined, matchesCurrentPage: false },
      ],
    });
  });

  it('marks presets that match the current page URL', async () => {
    const config = MadConfig.parse({
      activePreset: 'matching',
      presets: [
        {
          id: 'matching',
          name: 'Matching',
          include: { globs: ['https://example.com/*'] },
        },
        {
          id: 'not-matching',
          name: 'Not matching',
          include: { globs: ['https://other.example/*'] },
        },
      ],
    });
    vi.mocked(loadEditorConfigJsonc).mockResolvedValue({
      jsonc: '{}',
      source: 'sync',
      config,
    });
    vi.mocked(loadStoredImages).mockResolvedValue({ images: [] });

    await expect(loadPopupPresetList()).resolves.toMatchObject({
      activePresetId: 'matching',
      presets: [
        { id: 'matching', matchesCurrentPage: true },
        { id: 'not-matching', matchesCurrentPage: false },
      ],
    });
    expect(queryTabs).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
  });

  it('returns presets without images when local image data is unreadable', async () => {
    const config = MadConfig.parse({
      presets: [{ id: 'first', name: 'First', imageId: 'avatar.png' }],
    });
    vi.mocked(loadEditorConfigJsonc).mockResolvedValue({
      jsonc: '{}',
      source: 'local',
      config,
    });
    vi.mocked(loadStoredImages).mockResolvedValue({
      images: [],
      warning: 'Stored images were invalid and were ignored.',
    });

    await expect(loadPopupPresetList()).resolves.toMatchObject({
      presets: [{ id: 'first', image: undefined }],
    });
  });
});
