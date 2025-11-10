const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const roomsRoute = require('../routes/roomsRoute')
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

// Mock io object
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn()
}

app.use((req, res, next) => {
  req.io = mockIo
  req.redisClient = {}
  next()
})

app.use('/api/rooms', roomsRoute)

describe('Rooms Controller', () => {
  let testUserId
  let testUser
  let testRoomId

  beforeEach(async () => {
    // Create a test user
    testUser = new User({
      firebaseUserId: 'test-firebase-id-123',
      email: 'test@example.com',
      username: 'testuser',
      profilePictureUrl: 'https://example.com/pic.jpg',
      activeUser: true,
      rooms: []
    })
    const savedUser = await testUser.save()
    testUserId = savedUser._id.toString()
  })

  afterEach(async () => {
    await User.deleteMany({})
    await Room.deleteMany({})
    await ChatLog.deleteMany({})
    jest.clearAllMocks()
  })

  describe('POST /api/rooms/create/:userId', () => {
    it('should create a new room', async () => {
      const roomData = {
        roomName: 'Test Room',
        membersArray: []
      }

      const response = await request(app)
        .post(`/api/rooms/create/${testUserId}`)
        .send(roomData)
        .expect(201)

      expect(response.body).toHaveProperty('_id')
      expect(response.body.roomName).toBe(roomData.roomName)
      // Convert to string for comparison since MongoDB returns ObjectIds
      const userIdString = testUser._id.toString()
      const usersStrings = response.body.users.map(id => id.toString())
      expect(usersStrings).toContain(userIdString)
      testRoomId = response.body._id.toString()
    })

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .post(`/api/rooms/create/${fakeId}`)
        .send({ roomName: 'Test Room', membersArray: [] })
        .expect(404)
    })
  })

  describe('GET /api/rooms/:roomId', () => {
    beforeEach(async () => {
      // Create a test room
      const testRoom = new Room({
        roomName: 'Test Room',
        users: [testUser._id],
        profilePictureUrl: 'https://example.com/room.jpg'
      })
      const savedRoom = await testRoom.save()
      testRoomId = savedRoom._id.toString()
    })

    it('should get room by roomId', async () => {
      const response = await request(app)
        .get(`/api/rooms/${testRoomId}`)
        .expect(200)

      expect(response.body).toHaveProperty('roomId')
      expect(response.body.roomName).toBe('Test Room')
    })

    it('should return 404 if room not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .get(`/api/rooms/${fakeId}`)
        .expect(404)
    })
  })

  describe('GET /api/rooms/mongo/:userId', () => {
    beforeEach(async () => {
      // Create a test room and associate with user
      const testRoom = new Room({
        roomName: 'Test Room',
        users: [testUser._id]
      })
      const savedRoom = await testRoom.save()
      testRoomId = savedRoom._id.toString()

      // Update user to include room
      testUser.rooms.push(savedRoom._id)
      await testUser.save()
    })

    it('should get rooms by MongoDB userId', async () => {
      const response = await request(app)
        .get(`/api/rooms/mongo/${testUserId}`)
        .expect(201)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0].roomName).toBe('Test Room')
    })
  })

  describe('PATCH /api/rooms/:roomId', () => {
    beforeEach(async () => {
      const testRoom = new Room({
        roomName: 'Original Room Name',
        users: [testUser._id]
      })
      const savedRoom = await testRoom.save()
      testRoomId = savedRoom._id.toString()
    })

    it('should update room name', async () => {
      const updateData = {
        originalRoomName: 'Original Room Name',
        newRoomName: 'Updated Room Name',
        updatedById: testUserId,
        updatedByUsername: 'testuser'
      }

      const response = await request(app)
        .patch(`/api/rooms/${testRoomId}`)
        .send(updateData)
        .expect(201)

      expect(response.body).toBe(updateData.newRoomName)
    })

    it('should return 404 if room not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .patch(`/api/rooms/${fakeId}`)
        .send({
          originalRoomName: 'Original',
          newRoomName: 'Updated',
          updatedById: testUserId,
          updatedByUsername: 'testuser'
        })
        .expect(404)
    })
  })

  describe('PATCH /api/rooms/updateIcon/:roomId', () => {
    beforeEach(async () => {
      const testRoom = new Room({
        roomName: 'Test Room',
        users: [testUser._id]
      })
      const savedRoom = await testRoom.save()
      testRoomId = savedRoom._id.toString()
    })

    it('should update room icon', async () => {
      const newIconUrl = 'https://example.com/newicon.jpg'
      const response = await request(app)
        .patch(`/api/rooms/updateIcon/${testRoomId}`)
        .send({ newRoomIconUrl: newIconUrl })
        .expect(201)

      expect(response.body).toBe(newIconUrl)
    })
  })
})

