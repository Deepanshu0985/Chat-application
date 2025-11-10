const express = require("express")
const cors = require("cors")
const { connectToDatabase  }= require("./config/connectToDatabse")
require('dotenv').config()
const { Server } = require("socket.io")
const { connectToRedis, client, isRedisConnected } = require('./config/connectToRedis')
const { socket } = require('./utils/socketIO')
const { syncCache } = require('./utils/syncCache')


const app = express()
app.use(cors())
app.use(express.json())
connectToDatabase().then(async () => {
  // Only sync cache if Redis is available
  if (await connectToRedis()) {
    await syncCache()
  } else {
    console.log('Skipping cache sync - Redis not available')
  }
})

// const allowedOrigins = ['http://example.com', 'http://localhost:3000'];
// app.use(cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true)
//       } else {
//         callback(new Error('Not allowed by CORS'))
//       }
//     },
// }))

const PORT = process.env.PORT || 10000 // https://boisterous-sunburst-f3d32f.netlify.app/
const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
})

// Connect to Redis and initialize socket - don't block server startup if Redis fails
connectToRedis()
  .then((connected) => {
    if (connected) {
      socket(io)
      console.log('Socket.IO initialized with Redis')
    } else {
      socket(io)
      console.log('Socket.IO initialized without Redis (limited functionality)')
    }
  })
  .catch((error) => {
    console.error('Error initializing Redis:', error.message)
    socket(io)
    console.log('Socket.IO initialized without Redis (limited functionality)')
  }) 

// Enable CORS for specific routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

// Pass 'io' object to the relevant parts of application
app.use((req, res, next) => {
    req.io = io
    req.redisClient = client
    next()
})

// Include the users, rooms routes


const usersRoute = require('./routes/usersRoute')
app.use('/api/users', usersRoute)

const roomsRoute = require('./routes/roomsRoute')
app.use('/api/rooms', roomsRoute)

const chatLogsRoute = require('./routes/chatLogsRoute')
app.use('/api/chatLogs', chatLogsRoute)

const notificationsRoute = require('./routes/notificationsRoute')
app.use('/api/notifications', notificationsRoute)

const testRoute = require('./routes/testRoute')
app.use('/api/tests', testRoute)

module.exports = { app, server }