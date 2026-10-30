import { WallpaperProviderAdapter } from '../types';

export const geminiProvider: WallpaperProviderAdapter = {
  id: 'gemini',
  matches: (url) => url.hostname === 'gemini.google.com',
  stylesheetPath: 'providers/gemini.css',
  readingSelectors: 'user-query, model-response'
};
