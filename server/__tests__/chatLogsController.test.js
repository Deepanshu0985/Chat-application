const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const chatLogsRoute = require('../routes/chatLogsRoute')
const User = require('../models/userModel')
const Room = require('../models/roomModel')
const ChatLog = require('../models/chatLogModel')

const app = express()
app.use(express.json())

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

// Mock Redis client module
const mockRedisClient = {
  HGET: jest.fn().mockResolvedValue(null),
  HSET: jest.fn().mockResolvedValue(1),
  hGet: jest.fn().mockResolvedValue(null),
  hSet: jest.fn().mockResolvedValue(1),
  isOpen: true
}

jest.mock('../config/connectToRedis', () => ({
  client: mockRedisClient,
  connectToRedis: jest.fn().mockResolvedValue(true),
  isRedisConnected: jest.fn(() => true), // Mock to return true for tests
  hgetAsync: jest.fn(),
  hsetAsync: jest.fn()
}))

app.use((req, res, next) => {
  req.redisClient = {
    HGET: jest.fn().mockResolvedValue(null),
    HSET: jest.fn().mockResolvedValue(1)
  }
  next()
})

app.use('/api/chatLogs', chatLogsRoute)

describe('ChatLogs Controller', () => {
  let testUserId
  let testRoomId
  let testChatLogId
  let testFirebaseUserId

  beforeEach(async () => {
    // Create a test user
    const testUser = new User({
      firebaseUserId: 'test-firebase-id-123',
      email: 'test@example.com',
      username: 'testuser',
      profilePictureUrl: 'https://example.com/pic.jpg',
      activeUser: true,
      rooms: []
    })
    const savedUser = await testUser.save()
    testUserId = savedUser._id
    testFirebaseUserId = savedUser.firebaseUserId

    // Create a test room
    const testRoom = new Room({
      roomName: 'Test Room',
      users: [testUserId]
    })
    const savedRoom = await testRoom.save()
    testRoomId = savedRoom._id.toString()

    // Update user to include room
    testUser.rooms.push(savedRoom._id)
    await testUser.save()

    // Create a test chat log
    const testChatLog = new ChatLog({
      roomId: savedRoom._id,
      messages: []
    })
    const savedChatLog = await testChatLog.save()
    testChatLogId = savedChatLog._id.toString()
  })

  afterEach(async () => {
    await User.deleteMany({})
    await Room.deleteMany({})
    await ChatLog.deleteMany({})
    jest.clearAllMocks()
  })

  describe('PATCH /api/chatLogs/updateChatLog/:roomId', () => {
    it('should update chat log with new messages', async () => {
      const chatLogData = {
        chatLog: [
          {
            messageId: 'msg1',
            senderId: testUserId.toString(),
            username: 'testuser',
            messageContent: 'Hello, world!',
            dateCreated: new Date()
          },
          {
            messageId: 'msg2',
            senderId: testUserId.toString(),
            username: 'testuser',
            messageContent: 'How are you?',
            dateCreated: new Date()
          }
        ]
      }

      const response = await request(app)
        .patch(`/api/chatLogs/updateChatLog/${testRoomId}`)
        .send(chatLogData)
        .expect(201)

      expect(response.body).toHaveProperty('messages')
      expect(response.body.messages.length).toBe(2)
      expect(response.body.messages[0].messageContent).toBe('Hello, world!')
    })

    it('should return 404 if room not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .patch(`/api/chatLogs/updateChatLog/${fakeId}`)
        .send({
          chatLog: [{
            messageSender: testUserId.toString(),
            messageContent: 'Test message'
          }]
        })
        .expect(404)
    })
  })

  describe('GET /api/chatLogs/getChatLogs', () => {
    beforeEach(async () => {
      // Add messages to chat log
      const chatLog = await ChatLog.findOne({ roomId: testRoomId })
      chatLog.messages.push({
        messageId: 'msg1',
        senderId: testUserId,
        username: 'testuser',
        messageContent: 'Test message',
        dateCreated: new Date()
      })
      await chatLog.save()
    })

    it('should get chat logs by rooms array', async () => {
      const response = await request(app)
        .get('/api/chatLogs/getChatLogs')
        .query({ roomIdsArray: testRoomId })
        .expect(201)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('roomId')
      expect(response.body[0]).toHaveProperty('messagesArray')
    })
  })

  describe('GET /api/chatLogs/getChatLogsByFirebaseUserId/:firebaseUserId', () => {
    beforeEach(async () => {
      // Add messages to chat log
      const chatLog = await ChatLog.findOne({ roomId: testRoomId })
      chatLog.messages.push({
        messageId: 'msg1',
        senderId: testUserId,
        username: 'testuser',
        messageContent: 'Test message',
        dateCreated: new Date()
      })
      await chatLog.save()
    })

    it('should get chat logs by Firebase user ID', async () => {
      const response = await request(app)
        .get(`/api/chatLogs/getChatLogsByFirebaseUserId/${testFirebaseUserId}`)
        .expect(201)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('roomId')
      expect(response.body[0]).toHaveProperty('messagesArray')
    })
  })
})

