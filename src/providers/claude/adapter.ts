import { WallpaperProviderAdapter } from '../types';

export const claudeProvider: WallpaperProviderAdapter = {
  id: 'claude',
  matches: (url) => url.hostname === 'claude.ai',
  stylesheetPath: 'providers/claude.css',
  readingSelectors: '[data-testid="user-message"], .font-claude-response'
};
