import type { MadConfig, MadPreset, PresetId } from '@/schemas/config-schema';
import { loadEditorConfigJsonc } from '@/services/config/config-persistence';
import { CONFIG_STORAGE_KEY } from '@/services/storage/config-storage';

import type { DeclarativeNetRequestRule } from './dnr-rules';
import { createRulesForPreset } from './dnr-rules';
import { getToolbarIconState } from './toolbar-icon-state';

const SUCCESS_BADGE_COLOR = '#2e7d32';

interface ExtensionTab {
  id?: number;
  url?: string;
}

interface ExtensionApiLike {
  action?: {
    setBadgeBackgroundColor: (details: {
      color: string;
      tabId: number;
    }) => Promise<void>;
    setBadgeText: (details: { tabId: number; text: string }) => Promise<void>;
    setIcon: (details: {
      path: Readonly<Record<string, string>>;
      tabId: number;
    }) => Promise<void>;
  };
  storage?: {
    onChanged?: {
      addListener: (
        callback: (
          changes: Record<string, unknown>,
          areaName: string,
        ) => void | Promise<void>,
      ) => void;
    };
  };
  runtime?: {
    onInstalled?: {
      addListener: (callback: () => void | Promise<void>) => void;
    };
    onStartup?: {
      addListener: (callback: () => void | Promise<void>) => void;
    };
  };
  declarativeNetRequest?: {
    getSessionRules: () => Promise<Array<{ id: number }>>;
    updateSessionRules: (update: {
      removeRuleIds?: number[];
      addRules?: DeclarativeNetRequestRule[];
    }) => Promise<void>;
  };
  tabs?: {
    get: (tabId: number) => Promise<ExtensionTab>;
    query: (queryInfo: Record<string, never>) => Promise<ExtensionTab[]>;
    onActivated?: {
      addListener: (callback: (activeInfo: { tabId: number }) => void) => void;
    };
    onCreated?: {
      addListener: (callback: (tab: ExtensionTab) => void) => void;
    };
    onUpdated?: {
      addListener: (
        callback: (
          tabId: number,
          changeInfo: { url?: string },
          tab: ExtensionTab,
        ) => void,
      ) => void;
    };
  };
}

function getExtensionApi(): ExtensionApiLike {
  const globalApis = globalThis as typeof globalThis & {
    chrome?: ExtensionApiLike;
    browser?: ExtensionApiLike;
  };

  const api = globalApis.browser ?? globalApis.chrome;
  if (!api) {
    throw new Error('Browser extension API is not available');
  }

  return api;
}

function getActivePreset(
  presets: MadPreset[],
  activePresetId: PresetId | null,
): MadPreset | null {
  if (!activePresetId) {
    return null;
  }

  const activePreset = presets.find((preset) => preset.id === activePresetId);
  if (!activePreset || activePreset.disabled) {
    return null;
  }

  return activePreset;
}

async function syncDynamicRules(): Promise<void> {
  const extensionApi = getExtensionApi();
  const dnr = extensionApi.declarativeNetRequest;
  if (!dnr) {
    return;
  }

  const [{ config }, existingRules] = await Promise.all([
    loadEditorConfigJsonc(),
    dnr.getSessionRules(),
  ]);

  const activePreset = getActivePreset(config.presets, config.activePreset);
  const nextRules: DeclarativeNetRequestRule[] = activePreset
    ? createRulesForPreset(activePreset)
    : [];

  await dnr.updateSessionRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: nextRules,
  });
}

async function applyToolbarIconForTab(
  config: MadConfig,
  tab: ExtensionTab,
): Promise<void> {
  const extensionApi = getExtensionApi();
  const { action } = extensionApi;
  if (!action || tab.id === undefined) {
    return;
  }

  const state = getToolbarIconState(config, tab.url);

  await Promise.all([
    action.setIcon({
      path: state.iconPath,
      tabId: tab.id,
    }),
    action.setBadgeText({
      text: state.badgeText,
      tabId: tab.id,
    }),
    action.setBadgeBackgroundColor({
      color: SUCCESS_BADGE_COLOR,
      tabId: tab.id,
    }),
  ]);
}

async function syncToolbarIconForTab(tab: ExtensionTab): Promise<void> {
  const { config } = await loadEditorConfigJsonc();
  await applyToolbarIconForTab(config, tab);
}

async function syncAllToolbarIcons(): Promise<void> {
  const [tabs, { config }] = await Promise.all([
    getExtensionApi().tabs?.query({}),
    loadEditorConfigJsonc(),
  ]);
  if (!tabs) {
    return;
  }

  await Promise.all(tabs.map((tab) => applyToolbarIconForTab(config, tab)));
}

async function syncExtensionState(): Promise<void> {
  await Promise.all([syncDynamicRules(), syncAllToolbarIcons()]);
}

function onStorageChanged(
  changes: Record<string, unknown>,
  areaName: string,
): void {
  if (areaName !== 'sync' && areaName !== 'local') {
    return;
  }

  if (!(CONFIG_STORAGE_KEY in changes)) {
    return;
  }

  void syncExtensionState();
}

function registerListeners(): void {
  const extensionApi = getExtensionApi();

  extensionApi.runtime?.onInstalled?.addListener(() => {
    void syncExtensionState();
  });

  extensionApi.runtime?.onStartup?.addListener(() => {
    void syncExtensionState();
  });

  extensionApi.storage?.onChanged?.addListener(onStorageChanged);

  extensionApi.tabs?.onActivated?.addListener(({ tabId }) => {
    void extensionApi.tabs?.get(tabId).then(syncToolbarIconForTab);
  });

  extensionApi.tabs?.onCreated?.addListener((tab) => {
    void syncToolbarIconForTab(tab);
  });

  extensionApi.tabs?.onUpdated?.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.url !== undefined) {
      void syncToolbarIconForTab(tab);
    }
  });
}

registerListeners();
void syncExtensionState();
