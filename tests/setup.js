/**
 * Test Setup File
 * Runs before all tests to configure the testing environment
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global setup before all tests
beforeAll(async () => {
  console.log('🚀 Setting up test environment...');

  // Initialize test database connection
  // await db.connect();

  // Run migrations
  // await db.migrate();

  console.log('✅ Test environment ready');
});

// Global teardown after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  // Close database connections
  // await db.disconnect();

  console.log('✅ Test environment cleaned up');
});

// Reset state before each test
beforeEach(async () => {
  // Start a transaction for database tests
  // await db.beginTransaction();
});

// Clean up after each test
afterEach(async () => {
  // Rollback transaction to ensure clean state
  // await db.rollback();
});

// Global test utilities
global.testUtils = {
  // Add shared test utilities here
  createTestUser: (overrides = {}) => ({
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    ...overrides,
  }),

  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Add more utilities as needed
};
