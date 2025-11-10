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
jest.mock('../serviceAccount.json', () => ({}), { virtual: true })

const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const usersRoute = require('../routes/usersRoute')
const User = require('../models/userModel')

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

app.use('/api/users', usersRoute)

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

describe('Users Controller', () => {
  let testUserId
  let testFirebaseUserId

  beforeEach(async () => {
    // Create a test user
    const testUser = new User({
      firebaseUserId: 'test-firebase-id-123',
      email: 'test@example.com',
      username: 'testuser',
      profilePictureUrl: 'https://example.com/pic.jpg',
      activeUser: true
    })
    const savedUser = await testUser.save()
    testUserId = savedUser._id.toString()
    testFirebaseUserId = savedUser.firebaseUserId
  })

  afterEach(async () => {
    await User.deleteMany({})
  })

  describe('POST /api/users/create', () => {
    it('should create a new user', async () => {
      const newUserData = {
        firebaseUserId: 'new-firebase-id-456',
        email: 'newuser@example.com',
        username: 'newuser'
      }

      const response = await request(app)
        .post('/api/users/create')
        .send(newUserData)
        .expect(201)

      expect(response.body).toHaveProperty('_id')
      expect(response.body.email).toBe(newUserData.email)
      expect(response.body.username).toBe(newUserData.username)
      expect(response.body.firebaseUserId).toBe(newUserData.firebaseUserId)
    })

    it('should return 500 if user creation fails', async () => {
      const invalidUserData = {
        // Missing required fields
      }

      await request(app)
        .post('/api/users/create')
        .send(invalidUserData)
        .expect(500)
    })
  })

  describe('GET /api/users/:userId', () => {
    it('should get user by MongoDB userId', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200)

      expect(response.body).toHaveProperty('_id')
      expect(response.body.email).toBe('test@example.com')
      expect(response.body.username).toBe('testuser')
    })

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404)
    })
  })

  describe('GET /api/users/firebase/:firebaseUserId', () => {
    it('should get user by Firebase userId', async () => {
      const response = await request(app)
        .get(`/api/users/firebase/${testFirebaseUserId}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0].firebaseUserId).toBe(testFirebaseUserId)
    })
  })

  describe('PATCH /api/users/updateUsername/:userId', () => {
    it('should update user username', async () => {
      const newUsername = 'updatedusername'
      const response = await request(app)
        .patch(`/api/users/updateUsername/${testUserId}`)
        .send({ newUsername })
        .expect(200)

      expect(response.body.username).toBe(newUsername)
    })

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .patch(`/api/users/updateUsername/${fakeId}`)
        .send({ newUsername: 'newusername' })
        .expect(404)
    })
  })

  describe('PATCH /api/users/updateUserProfilePicture/:userId', () => {
    it('should update user profile picture', async () => {
      const newProfilePictureUrl = 'https://example.com/newpic.jpg'
      const response = await request(app)
        .patch(`/api/users/updateUserProfilePicture/${testUserId}`)
        .send({ updatedUserProfilePictureUrl: newProfilePictureUrl })
        .expect(201)

      expect(response.body.profilePictureUrl).toBe(newProfilePictureUrl)
    })

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .patch(`/api/users/updateUserProfilePicture/${fakeId}`)
        .send({ updatedUserProfilePictureUrl: 'https://example.com/pic.jpg' })
        .expect(404)
    })
  })
})

