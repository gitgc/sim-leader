# Testing Guide

This document provides information about the testing setup and how to run tests for the Formula Evergreen Championship application.

## Test Structure

The test suite is organized into several categories:

### Unit Tests (`tests/unit/`)
- **`leaderboard.test.js`** - Tests for the Leaderboard model
- **`raceSettings.test.js`** - Tests for the RaceSettings model  
- **`auth.test.js`** - Tests for authentication middleware
- **`utils.test.js`** - Tests for utility functions (validation, formatting, etc.)
- **`database.test.js`** - Tests for database configuration and operations

### Integration Tests (`tests/integration/`)
- **`api.test.js`** - Tests for API endpoints with mocked database
- **`e2e.test.js`** - End-to-end workflow tests

## Test Commands

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Run only unit tests
npm test -- --testPathPatterns=unit

# Run only integration tests  
npm test -- --testPathPatterns=integration

# Run a specific test file
npm test -- --testPathPatterns=leaderboard.test.js
```

## Test Technologies

- **Jest** - Testing framework
- **Supertest** - HTTP testing library for API endpoints
- **SQLite** - In-memory database for testing (instead of PostgreSQL)
- **Mocking** - Passport, database connections, and external dependencies

## Test Coverage

The test suite covers:

- ✅ **Models**: Leaderboard and RaceSettings models (100% coverage)
- ✅ **Authentication**: Login, logout, and authorization middleware
- ✅ **API Endpoints**: All REST endpoints with various scenarios
- ✅ **Validation**: Input validation and data sanitization
- ✅ **Utility Functions**: Date formatting, HTML escaping, file validation
- ✅ **Database Operations**: CRUD operations, transactions, error handling
- ✅ **End-to-End Workflows**: Complete championship management scenarios

Current coverage: **81.25%** overall

## Test Environment

Tests run with:
- Node environment set to `test`
- In-memory SQLite database
- Mocked authentication (no actual Google OAuth)
- Isolated test data (cleaned between tests)

## Writing New Tests

### Unit Test Example
```javascript
const { describe, test, expect } = require('@jest/globals');

describe('New Feature', () => {
  test('should do something', () => {
    expect(someFunction()).toBe(expectedValue);
  });
});
```

### API Test Example
```javascript
const request = require('supertest');

test('should create new resource', async () => {
  const response = await request(app)
    .post('/api/resource')
    .send({ data: 'test' })
    .expect(201);
    
  expect(response.body.id).toBeDefined();
});
```

## Debugging Tests

### View Detailed Output
```bash
npm test -- --verbose
```

### Debug Specific Test
```bash
npm test -- --testNamePattern="test name"
```

### Check Test Setup
```bash
# Verify Jest configuration
cat package.json | grep -A 10 '"jest"'
```

## Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Use Descriptive Names** - Test names should explain what they verify
3. **Mock External Dependencies** - Don't rely on external services
4. **Test Edge Cases** - Include boundary conditions and error cases
5. **Keep Tests Fast** - Use in-memory databases and minimal setup
6. **Clean Up** - Always clean test data between tests

## Continuous Integration

Tests are designed to run in CI environments:
- No external dependencies required
- Uses in-memory SQLite database
- Includes both unit and integration tests
- Generates coverage reports

## Troubleshooting

### Common Issues

**SQLite deprecation warnings**: These are harmless warnings from the SQLite connection string format.

**Database connection errors**: Ensure tests use the in-memory SQLite database, not the real PostgreSQL database.

**Timeout issues**: If tests are slow, check that database connections are properly closed in `afterAll` hooks.

**Mocking issues**: Ensure mocks are reset between tests using `jest.clearAllMocks()` in `beforeEach`.
