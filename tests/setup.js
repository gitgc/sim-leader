// Test setup and configuration

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.DB_NAME = 'test_sim_leader'
process.env.DB_USER = 'test_user'
process.env.DB_PASSWORD = 'test_password'
process.env.DB_HOST = 'localhost'
process.env.PORT = '3001'
process.env.SESSION_SECRET = 'test-secret'
process.env.GOOGLE_CLIENT_ID = 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
process.env.AUTHORIZED_EMAILS = 'admin@test.com,user@test.com'

// Mock console.log and console.error for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}

// Global test timeout
jest.setTimeout(30000)
