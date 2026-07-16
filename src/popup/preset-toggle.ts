import type {
  Base64Image,
  MadConfig,
  MadPreset,
  PresetId,
} from '@/schemas/config-schema';
import type {
  ConfigPipelineFailure,
  SaveConfigPipelineResult,
} from '@/services/config/config-persistence';
import {
  loadEditorConfigJsonc,
  saveConfig,
} from '@/services/config/config-persistence';
import {
  compilePresetMatchers,
  isUrlMatchedByPreset,
} from '@/services/config/url-matcher';
import { loadStoredImages } from '@/services/storage/image-storage';

export type PopupPreset = MadPreset & {
  image?: Base64Image;
  matchesCurrentPage: boolean;
};

export interface PopupPresetListResult {
  activePresetId: PresetId | null;
  presets: PopupPreset[];
}

export interface TogglePresetResult {
  activePresetId: PresetId | null;
  saveResult: SaveConfigPipelineResult;
}

interface ExtensionTab {
  url?: string;
}

interface ExtensionApiLike {
  tabs?: {
    query: (queryInfo: {
      active: boolean;
      currentWindow: boolean;
    }) => Promise<ExtensionTab[]>;
  };
}

async function getActiveTab(): Promise<ExtensionTab | undefined> {
  const globalApis = globalThis as typeof globalThis & {
    browser?: ExtensionApiLike;
    chrome?: ExtensionApiLike;
  };
  const extensionApi = globalApis.browser ?? globalApis.chrome;
  if (!extensionApi?.tabs) {
    throw new Error('Extension tabs API is not available');
  }

  const [activeTab] = await extensionApi.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}

function nextActivePresetId(
  currentActivePresetId: PresetId | null,
  targetPresetId: PresetId,
): PresetId | null {
  return currentActivePresetId === targetPresetId ? null : targetPresetId;
}

function withActivePreset(
  config: MadConfig,
  presetId: PresetId | null,
): MadConfig {
  return {
    ...config,
    activePreset: presetId,
  };
}

export async function loadPopupPresetList(): Promise<PopupPresetListResult> {
  const [{ config }, { images }, activeTab] = await Promise.all([
    loadEditorConfigJsonc(),
    loadStoredImages(),
    getActiveTab(),
  ]);
  const imagesById = new Map(images.map((image) => [image.id, image]));

  return {
    activePresetId: config.activePreset,
    presets: config.presets
      .filter((preset) => !preset.disabled)
      .map((preset) => ({
        ...preset,
        image: preset.imageId ? imagesById.get(preset.imageId) : undefined,
        matchesCurrentPage:
          activeTab?.url !== undefined &&
          isUrlMatchedByPreset(activeTab.url, compilePresetMatchers(preset)),
      })),
  };
}

export async function togglePopupPreset(
  presetId: PresetId,
): Promise<TogglePresetResult> {
  const { config } = await loadEditorConfigJsonc();

  const targetPreset = config.presets.find((preset) => preset.id === presetId);
  if (!targetPreset || targetPreset.disabled) {
    const failure: ConfigPipelineFailure = {
      ok: false,
      code: 'config-validation',
      errors: [
        {
          message: `Preset "${presetId}" is not available`,
          path: 'presets',
        },
      ],
    };

    return {
      activePresetId: config.activePreset,
      saveResult: failure,
    };
  }

  const activePresetId = nextActivePresetId(config.activePreset, presetId);
  const updatedConfig = withActivePreset(config, activePresetId);
  const saveResult = await saveConfig(updatedConfig);

  return {
    activePresetId: saveResult.ok
      ? saveResult.config.activePreset
      : config.activePreset,
    saveResult,
  };
}
