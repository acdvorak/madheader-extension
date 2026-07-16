import type { MadConfig } from '@/schemas/config-schema';

export function normalizeConfig(config: MadConfig): MadConfig {
  const activePreset =
    config.activePreset &&
    config.presets.some((preset) => preset.id === config.activePreset)
      ? config.activePreset
      : null;

  return {
    ...config,
    activePreset,
  };
}
