# Testing Guide

This directory contains comprehensive test suites for the real-time chat application server.

## Test Structure

- `testController.test.js` - Tests for basic test endpoints
- `usersController.test.js` - Tests for user-related endpoints
- `roomsController.test.js` - Tests for room/group-related endpoints
- `chatLogsController.test.js` - Tests for chat log endpoints
- `integration/app.test.js` - Integration tests for full user flows

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- usersController.test.js
```

### Run unit tests only
```bash
npm run test:unit
```

### Run integration tests only
```bash
npm run test:integration
```

## Test Setup

Tests use:
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **MongoDB Memory Server** - In-memory MongoDB for testing

## Writing New Tests

When writing new tests:

1. Create a test file with `.test.js` extension
2. Set up MongoDB Memory Server in `beforeAll`
3. Clean up data in `afterEach`
4. Close connections in `afterAll`
5. Mock external dependencies (Firebase, Redis, Socket.IO)

Example test structure:

```javascript
const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

// Mock external dependencies
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: () => ({
    deleteUser: jest.fn().mockResolvedValue(true)
  })
}))

const app = express()
app.use(express.json())
// ... setup routes

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
})

describe('Your Test Suite', () => {
  it('should test something', async () => {
    // Your test code
  })
})
```

## Notes

- Tests run against an in-memory MongoDB instance, so no external database is required
- External services (Firebase, Redis, Socket.IO) are mocked
- Each test file manages its own database connection
- Tests are isolated and don't affect each other

