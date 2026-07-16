import type { MadConfig, MadPreset, PresetId } from '@/schemas/config-schema';
import type { CompiledPresetMatcher } from '@/services/config/url-matcher';
import { isUrlMatchedByPreset } from '@/services/config/url-matcher';

export interface MutableRequestHeader {
  name: string;
  value?: string;
}

export interface HeaderApplicationResult {
  matchedPresetName: string | null;
  requestHeaders: MutableRequestHeader[];
}

interface HeaderState {
  config: MadConfig;
  matchersByPresetId: ReadonlyMap<PresetId, CompiledPresetMatcher>;
}

function buildMatcherMap(
  compiledMatchers: CompiledPresetMatcher[],
): ReadonlyMap<PresetId, CompiledPresetMatcher> {
  return new Map(
    compiledMatchers.map((matcher): [PresetId, CompiledPresetMatcher] => {
      return [matcher.presetId, matcher];
    }),
  );
}

function normalizeHeaderName(headerName: string): string {
  return headerName.trim().toLowerCase();
}

function upsertHeader(
  requestHeaders: MutableRequestHeader[],
  name: string,
  value: string,
): void {
  const normalizedTargetName = normalizeHeaderName(name);
  const existing = requestHeaders.find((entry) => {
    return normalizeHeaderName(entry.name) === normalizedTargetName;
  });

  if (existing) {
    existing.value = value;
    return;
  }

  requestHeaders.push({ name, value });
}

function findPresetById(
  config: MadConfig,
  presetId: PresetId,
): MadPreset | null {
  return config.presets.find((preset) => preset.id === presetId) ?? null;
}

function findActiveAndEnabledPreset(config: MadConfig): MadPreset | null {
  if (!config.activePreset) {
    return null;
  }

  const preset = findPresetById(config, config.activePreset);
  if (!preset || preset.disabled) {
    return null;
  }

  return preset;
}

export function createHeaderApplicationState(
  config: MadConfig,
  compiledMatchers: CompiledPresetMatcher[],
): HeaderState {
  return {
    config,
    matchersByPresetId: buildMatcherMap(compiledMatchers),
  };
}

export function applyPresetHeadersToRequest(
  url: string | URL,
  requestHeaders: MutableRequestHeader[],
  headerState: HeaderState,
): HeaderApplicationResult {
  const activePreset = findActiveAndEnabledPreset(headerState.config);
  if (!activePreset) {
    return {
      matchedPresetName: null,
      requestHeaders,
    };
  }

  const matcher = headerState.matchersByPresetId.get(activePreset.id);
  if (!matcher || !isUrlMatchedByPreset(url, matcher)) {
    return {
      matchedPresetName: null,
      requestHeaders,
    };
  }

  const nextRequestHeaders = [...requestHeaders];
  Object.entries(activePreset.reqHeaders).forEach(([name, value]) => {
    upsertHeader(nextRequestHeaders, name, value);
  });

  return {
    matchedPresetName: activePreset.name,
    requestHeaders: nextRequestHeaders,
  };
}
