import { WallpaperProviderAdapter } from '../types';

export const geminiProvider: WallpaperProviderAdapter = {
  id: 'gemini',
  matches: (url) => url.hostname === 'gemini.google.com',
  stylesheetPath: 'providers/gemini.css',
  wallpaperViewportSelectors: ['bard-sidenav-content', 'main', '[role="main"]'],
  readingSelectors: 'user-query, model-response'
};
