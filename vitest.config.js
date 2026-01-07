import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for API and Unit Tests
 */
export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test timeout
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
      ],
    },

    // Setup files
    setupFiles: ['./tests/setup.js'],

    // Global test settings
    globals: true,

    // Include patterns
    include: ['tests/api/**/*.test.js', 'tests/unit/**/*.test.js', 'tests/database/**/*.test.js'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
});
