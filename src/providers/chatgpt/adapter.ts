import { WallpaperProviderAdapter } from '../types';

export const chatgptProvider: WallpaperProviderAdapter = {
  id: 'chatgpt',
  matches: (url) => url.hostname === 'chatgpt.com',
  stylesheetPath: 'providers/chatgpt.css',
  readingSelectors: '[data-message-author-role]'
};
