import { describe, it, expect } from 'vitest';
import { detectDevicePerformance, getOptimalSettings } from '../performance.js';

describe('Performance Utils', () => {
  describe('detectDevicePerformance', () => {
    it('should return performance level as string', () => {
      const performance = detectDevicePerformance();
      expect(typeof performance).toBe('string');
      expect(['low', 'medium', 'high']).toContain(performance);
    });

    it('should handle missing navigator properties gracefully', () => {
      // Mock limited navigator
      const originalNavigator = global.navigator;
      global.navigator = {} as Navigator;

      const performance = detectDevicePerformance();
      expect(typeof performance).toBe('string');

      // Restore navigator
      global.navigator = originalNavigator;
    });
  });

  describe('getOptimalSettings', () => {
    it('should return valid settings object', () => {
      const settings = getOptimalSettings();

      expect(settings).toHaveProperty('animationsEnabled');
      expect(settings).toHaveProperty('particleCount');
      expect(settings).toHaveProperty('qualityLevel');
      expect(settings).toHaveProperty('performanceMode');

      expect(typeof settings.animationsEnabled).toBe('boolean');
      expect(typeof settings.performanceMode).toBe('boolean');
    });

    it('should have valid quality levels', () => {
      const settings = getOptimalSettings();
      expect(['low', 'medium', 'high']).toContain(settings.qualityLevel);
    });

    it('should have valid particle count settings', () => {
      const settings = getOptimalSettings();
      expect(['low', 'normal', 'reduced']).toContain(settings.particleCount);
    });
  });
});
