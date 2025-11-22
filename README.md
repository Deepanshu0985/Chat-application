# Real-Time Chat Application

A robust, scalable real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO. This application supports real-time messaging, group chats, user authentication, and message persistence.

![Chat Application Screenshot](https://via.placeholder.com/800x400?text=Chat+Application+Preview)
*(Note: Replace with actual screenshot)*

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using Socket.IO.
- **Group Chats**: Create and manage group conversations with multiple users.
- **User Authentication**: Secure signup and login functionality.
- **Persistent History**: Chat history is stored in MongoDB and retrieved upon login.
- **Scalability**: Integrated Redis adapter for Socket.IO to support horizontal scaling.
- **Modern UI**: Built with React and Material UI for a responsive and clean interface.
- **State Management**: Redux Toolkit for efficient state management on the client.

## 🛠️ Tech Stack

### Client (Frontend)
- **React**: UI Library.
- **Redux Toolkit**: State management.
- **Material UI (MUI)**: Component library for styling.
- **Socket.io-client**: Real-time bidirectional event-based communication.
- **Axios**: HTTP client for API requests.
- **Firebase**: Used for authentication/storage services.

### Server (Backend)
- **Node.js & Express**: Backend runtime and framework.
- **Socket.io**: Real-time engine.
- **MongoDB & Mongoose**: NoSQL database for storing users, groups, and messages.
- **Redis**: In-memory data store used as a Socket.IO adapter for scaling.
- **Firebase Admin**: Server-side Firebase integration.

## 📋 Prerequisites

Before running the application, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **MongoDB** (Local or Atlas connection string)
- **Redis** (Optional but recommended for production/scaling)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd reat-time-chat-app-main
```

### 2. Server Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:
```env
PORT=10000
ATLAS_URI_1=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true
PROJECT_ID=<your-firebase-project-id>
REDIS_URL=redis://127.0.0.1:6379  # Optional: If using Redis
# REDIS_DISABLED=true             # Optional: To explicitly disable Redis
```

### 3. Client Setup
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:
```env
REACT_APP_API_URL=http://localhost:10000/api
REACT_APP_SOCKET_URL=http://localhost:10000
```

## 🚀 Running the Application

### Start the Server
From the `server` directory:
```bash
npm start
```
*The server will run on http://localhost:10000*

### Start the Client
From the `client` directory:
```bash
npm start
```
*The client will run on http://localhost:3000*

## 🧪 Testing

To verify the setup:
1. Open `http://localhost:3000` in two different browser windows/tabs.
2. Register/Login as **User A** in the first window.
3. Register/Login as **User B** in the second window.
4. Create a group and add both users.
5. Send messages and verify they appear instantly in both windows.

## 📂 Project Structure

```
reat-time-chat-app-main/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── Components/     # Reusable UI components
│   │   ├── Redux/          # Redux slices and store
│   │   └── utils/          # Helper functions
│   └── package.json
├── server/                 # Node.js Backend
│   ├── config/             # DB and other configs
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose models (User, Message, etc.)
│   ├── routes/             # API routes
│   ├── index.js            # Entry point
│   └── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.
