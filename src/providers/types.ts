export const PROVIDER_IDS = ['chatgpt', 'claude', 'gemini'] as const;
export type ProviderId = typeof PROVIDER_IDS[number];

export interface WallpaperProviderAdapter {
  id: ProviderId;
  matches(url: URL): boolean;
  stylesheetPath: string;
}
