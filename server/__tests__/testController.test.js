const request = require('supertest')
const express = require('express')
const testRoute = require('../routes/testRoute')

const app = express()
app.use(express.json())

// Mock io and redisClient middleware
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn()
}

app.use((req, res, next) => {
  req.io = mockIo
  req.redisClient = {
    HGET: jest.fn().mockResolvedValue(null),
    HSET: jest.fn().mockResolvedValue(1)
  }
  next()
})

app.use('/api/tests', testRoute)

describe('Test Controller', () => {
  describe('GET /api/tests/check', () => {
    it('should return 400 with "it works" message', async () => {
      const response = await request(app)
        .get('/api/tests/check')
        .expect(400)
      
      expect(response.text).toBe('it works')
    })
  })

  describe('GET /api/tests/healthCheck', () => {
    it('should return 200 status', async () => {
      await request(app)
        .get('/api/tests/healthCheck')
        .expect(200)
    })
  })
})

