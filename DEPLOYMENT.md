# Deployment Guide

This application uses a split deployment strategy:
- **Frontend (Client)**: Deployed on **Vercel**.
- **Backend (Server)**: Deployed on **Render**.

## Part 1: Backend Deployment (Render)

1.  **Create a Render Account**: Go to [render.com](https://render.com) and sign up/login.
2.  **New Web Service**:
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repository.
3.  **Configuration**:
    *   **Name**: `chat-app-server` (or any name).
    *   **Root Directory**: `server`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    *   Scroll down to "Environment Variables" and add:
        *   `ATLAS_URI_1`: Your MongoDB connection string.
        *   `PROJECT_ID`: Your Firebase project ID.
        *   `REDIS_URL`: Your Redis URL (or use `REDIS_DISABLED=true` if you don't have one).
        *   `FIREBASE_SERVICE_ACCOUNT`: The content of your `server/serviceAccount.json` file. Paste the entire JSON content as the value.
        *   `PORT`: `10000`
5.  **Deploy**: Click **Create Web Service**.
6.  **Copy URL**: Once deployed, copy the service URL (e.g., `https://chat-app-server.onrender.com`).

## Part 2: Frontend Deployment (Vercel)

1.  **Create a Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up/login.
2.  **Add New Project**:
    *   Click **Add New...** -> **Project**.
    *   Import your GitHub repository.
3.  **Configure Project**:
    *   **Framework Preset**: `Create React App`.
    *   **Root Directory**: Click `Edit` and select `client`.
4.  **Environment Variables**:
    *   Add the following variables:
        *   `REACT_APP_API_URL`: `https://<your-render-url>/api`
        *   `REACT_APP_SOCKET_URL`: `https://<your-render-url>`
        *   `REACT_APP_FIREBASE_API_KEY`: `AIzaSyCKSMk3tQc4R-3j0qOvlYIiClYa3swlIoU`
        *   `REACT_APP_FIREBASE_AUTH_DOMAIN`: `chat-app-2de01.firebaseapp.com`
        *   `REACT_APP_FIREBASE_PROJECT_ID`: `chat-app-2de01`
        *   `REACT_APP_FIREBASE_STORAGE_BUCKET`: `chat-app-2de01.firebasestorage.app`
        *   `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: `807803774229`
        *   `REACT_APP_FIREBASE_APP_ID`: `1:807803774229:web:cd657a9c00e9e87cc3b51c`
        *   `REACT_APP_FIREBASE_MEASUREMENT_ID`: `G-DLZ0PNZBKZ`
5.  **Deploy**: Click **Deploy**.

## Part 3: Final Configuration

1.  **Update Backend CORS**:
    *   Go back to your **Render** dashboard.
    *   Add/Update the environment variable `CLIENT_URL` to your new Vercel URL (e.g., `https://your-app.vercel.app`).
    *   This ensures the server accepts connections from your deployed frontend.

## Troubleshooting

*   **Socket Connection Failed**: Ensure `REACT_APP_SOCKET_URL` in Vercel matches your Render URL exactly (no trailing slash usually, but check console logs).
*   **CORS Errors**: Verify `CLIENT_URL` in Render matches your Vercel URL.
