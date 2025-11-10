// Mock Firebase Admin before imports
jest.mock('firebase-admin', () => {
  const mockAuth = {
    deleteUser: jest.fn().mockResolvedValue(true)
  }
  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn()
    },
    auth: jest.fn(() => mockAuth)
  }
})

// Mock serviceAccount
jest.mock('../../serviceAccount.json', () => ({}), { virtual: true })

// Mock Socket.IO
jest.mock('../../utils/socketIO', () => ({
  socket: jest.fn()
}))

// Mock Redis
jest.mock('../../config/connectToRedis', () => ({
  connectToRedis: jest.fn().mockResolvedValue(true),
  isRedisConnected: jest.fn(() => true),
  client: {
    HGET: jest.fn().mockResolvedValue(null),
    HSET: jest.fn().mockResolvedValue(1),
    hGet: jest.fn().mockResolvedValue(null),
    hSet: jest.fn().mockResolvedValue(1),
    isOpen: true
  }
}))

// Mock syncCache
jest.mock('../../utils/syncCache', () => ({
  syncCache: jest.fn().mockResolvedValue(true)
}))

// Mock database connection
jest.mock('../../config/connectToDatabse', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true)
}))

const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const User = require('../../models/userModel')
const Room = require('../../models/roomModel')
const ChatLog = require('../../models/chatLogModel')

// Create a test app
const app = express()
app.use(express.json())

// Mock io object
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn()
}

app.use((req, res, next) => {
  req.io = mockIo
  req.redisClient = {
    HGET: jest.fn().mockResolvedValue(null),
    HSET: jest.fn().mockResolvedValue(1),
    hGet: jest.fn().mockResolvedValue(null),
    hSet: jest.fn().mockResolvedValue(1)
  }
  next()
})

// Import routes
const usersRoute = require('../../routes/usersRoute')
const roomsRoute = require('../../routes/roomsRoute')
const testRoute = require('../../routes/testRoute')

app.use('/api/users', usersRoute)
app.use('/api/rooms', roomsRoute)
app.use('/api/tests', testRoute)

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

describe('Integration Tests', () => {
  describe('User and Room Creation Flow', () => {
    it('should create a user and then create a room for that user', async () => {
      // Create a user
      const userData = {
        firebaseUserId: 'integration-test-firebase-id',
        email: 'integration@example.com',
        username: 'integrationuser'
      }

      const userResponse = await request(app)
        .post('/api/users/create')
        .send(userData)
        .expect(201)

      const userId = userResponse.body._id

      // Create a room for the user
      const roomData = {
        roomName: 'Integration Test Room',
        membersArray: []
      }

      const roomResponse = await request(app)
        .post(`/api/rooms/create/${userId}`)
        .send(roomData)
        .expect(201)

      expect(roomResponse.body.roomName).toBe(roomData.roomName)
      // Convert to string for comparison since MongoDB returns ObjectIds
      const userIdString = userId.toString()
      const usersStrings = roomResponse.body.users.map(id => id.toString())
      expect(usersStrings).toContain(userIdString)

      // Verify user was updated with room
      const updatedUser = await User.findById(userId)
      const roomIdString = roomResponse.body._id.toString()
      const userRoomsStrings = updatedUser.rooms.map(id => id.toString())
      expect(userRoomsStrings).toContain(roomIdString)
    })
  })

  describe('Health Check', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/api/tests/healthCheck')
        .expect(200)
    })
  })
})

