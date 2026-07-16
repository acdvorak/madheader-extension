import type { MadConfig } from '@/schemas/config-schema';
import { loadEditorConfigJsonc } from '@/services/config/config-persistence';
import { compileEnabledPresetMatchers } from '@/services/config/url-matcher';

import type { MutableRequestHeader } from './request-header-application';
import {
  applyPresetHeadersToRequest,
  createHeaderApplicationState,
} from './request-header-application';

interface RequestControllerState {
  config: MadConfig;
  compiledMatcherCount: number;
}

export interface RequestController {
  refresh: () => Promise<RequestControllerState>;
  apply: (
    url: string | URL,
    requestHeaders: MutableRequestHeader[],
  ) => Promise<MutableRequestHeader[]>;
}

export function createBackgroundRequestController(): RequestController {
  let headerState = createHeaderApplicationState(
    {
      activePreset: null,
      presets: [],
    },
    [],
  );

  async function refresh(): Promise<RequestControllerState> {
    const loaded = await loadEditorConfigJsonc();
    headerState = createHeaderApplicationState(
      loaded.config,
      compileEnabledPresetMatchers(loaded.config),
    );

    return {
      config: loaded.config,
      compiledMatcherCount: loaded.config.presets.length,
    };
  }

  async function apply(
    url: string | URL,
    requestHeaders: MutableRequestHeader[],
  ): Promise<MutableRequestHeader[]> {
    const { config } = await loadEditorConfigJsonc();
    headerState = createHeaderApplicationState(
      config,
      compileEnabledPresetMatchers(config),
    );

    const applied = applyPresetHeadersToRequest(
      url,
      requestHeaders,
      headerState,
    );
    return applied.requestHeaders;
  }

  return {
    refresh,
    apply,
  };
}
