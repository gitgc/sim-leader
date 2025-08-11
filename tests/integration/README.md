# Integration Tests

This directory contains integration tests for the sim-leader application APIs. The tests have been organized into separate files for better maintainability and focused testing.

## Test Files

### API-Specific Tests

- **`auth-api.test.js`** - Tests for authentication endpoints
  - GET `/auth/user` - User authentication status and authorization

- **`leaderboard-api.test.js`** - Tests for leaderboard management endpoints
  - GET `/leaderboard` - Retrieve leaderboard entries
  - POST `/leaderboard` - Create new leaderboard entries (auth required)
  - PUT `/leaderboard/:id` - Update existing leaderboard entries (auth required)
  - DELETE `/leaderboard/:id` - Delete leaderboard entries (auth required)
  - DELETE `/leaderboard/:id/profile-picture` - Delete driver profile pictures (auth required)
  - Comprehensive authentication vs unauthenticated user testing
  - Validation and authorization tests for all CRUD operations

- **`race-settings-api.test.js`** - Tests for race settings management endpoints
  - GET `/race-settings` - Retrieve race settings
  - POST `/race-settings/clear-next-race` - Clear next race information
  - Authentication and authorization tests

- **`error-handling-api.test.js`** - Tests for error handling across all APIs
  - Database error scenarios
  - HTTP status code handling (400, 404, 408, 500)
  - Malformed request handling
  - Route not found scenarios

### End-to-End Tests

- **`e2e.test.js`** - Complete workflow tests that span multiple APIs

## Shared Test Utilities

- **`test-setup.js`** - Shared test setup utilities
  - `createTestApp()` - Creates a basic test Express app with database
  - `createAuthenticatedApp()` - Creates a mock app with authenticated user
  - `createUnauthenticatedApp()` - Creates a mock app with unauthenticated user

## Running Tests

### Run All Integration Tests

```bash
npm test tests/integration/
```

### Run Specific API Tests

```bash
# Auth API tests
npm test tests/integration/auth-api.test.js

# Leaderboard API tests
npm test tests/integration/leaderboard-api.test.js

# Race Settings API tests
npm test tests/integration/race-settings-api.test.js

# Error Handling tests
npm test tests/integration/error-handling-api.test.js

# End-to-End tests
npm test tests/integration/e2e.test.js
```

## Test Structure Benefits

1. **Focused Testing** - Each file tests a specific API domain
2. **Better Organization** - Easy to find tests for specific functionality
3. **Parallel Execution** - Jest can run files in parallel for faster execution
4. **Easier Maintenance** - Changes to one API only require updating one test file
5. **Clear Dependencies** - Shared setup utilities prevent code duplication

## Test Coverage

The split test files provide comprehensive coverage including:

- ✅ Authentication and authorization scenarios
- ✅ CRUD operations for all entities
- ✅ Input validation and error handling
- ✅ Database error scenarios
- ✅ HTTP status code verification
- ✅ Edge cases and boundary conditions

Total Tests: **100 tests** across **10 test suites**
