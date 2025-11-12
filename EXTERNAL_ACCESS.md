# Accessing the App from External Devices

This guide explains how to access your SunLMS application from other devices on the same Wi-Fi network. There are two methods available:

## Method 1: Direct Access via Vite (Recommended - Simplest)

This is the simplest method and works out of the box. Vite automatically proxies API requests to your backend.

### Quick Start

1. **Start both servers:**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server (port 5000)
   - Frontend Vite dev server (port 5173) with API proxy enabled

2. **Find your computer's IP address:**
   - **Windows:** Open PowerShell and run `ipconfig`. Look for "IPv4 Address" under your Wi-Fi adapter.
   - **Mac/Linux:** Run `ifconfig` or `ip addr` and look for your Wi-Fi adapter's IP.

3. **On your external device:**
   - Make sure it's connected to the same Wi-Fi network
   - Open a web browser
   - Navigate to: `http://YOUR_IP_ADDRESS:5173`
   - Example: `http://192.168.1.100:5173`

### How It Works

- **Vite** is configured to accept external connections (`host: true`)
- **Vite automatically proxies** `/api/*` requests to your backend on `localhost:5000`
- **API client automatically detects** external access and uses relative URLs (`/api`)
- No additional configuration needed!

### Configuration

**No configuration required!** The system automatically:
- Detects when accessed from an external device (non-localhost hostname)
- Uses relative URLs (`/api`) which Vite proxies to the backend
- Works seamlessly on both localhost and external devices

## Method 2: Using Browser-Sync (Alternative)

Browser-sync provides additional features like live reload synchronization across devices.

### Quick Start

1. **Start the backend server:**
   ```bash
   npm run server
   ```

2. **Start the frontend dev server:**
   ```bash
   npm run dev:client
   ```

3. **Start browser-sync:**
   ```bash
   npm run sync
   ```

   Or use the all-in-one command:
   ```bash
   npm run dev:external
   ```

4. **On your external device:**
   - Navigate to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

### Backend CORS

The backend is already configured to allow requests from local network IPs in development mode. No additional configuration needed!

## Troubleshooting

### Can't Access from External Device

1. **Check Windows Firewall:**
   - Windows may block Node.js from accepting external connections
   - When you start the servers, allow Node.js through the firewall when prompted
   - Or manually add Node.js to Windows Firewall exceptions

2. **Verify Same Network:**
   - Both devices must be on the same Wi-Fi network
   - Try pinging your computer's IP from the external device

3. **Check Ports:**
   - Backend: Port 5000 (or your configured PORT)
   - Frontend: Port 5173 (Method 1) or Port 3000 (Method 2 - browser-sync)
   - Make sure these ports aren't blocked by firewall

### API Calls Not Working

1. **Check Browser Console:**
   - Open developer tools on the external device (F12)
   - Look for console logs showing API URL configuration:
     ```
     [API Client] API URL: /api
     [API Client] Hostname: 192.168.1.100
     [API Client] External access detected: true
     ```
   - Look for CORS errors or network errors
   - Verify API calls are going to `/api` (relative URL)

2. **Verify Vite Proxy:**
   - Make sure Vite dev server is running
   - Check that requests to `/api/*` are being proxied
   - Look in the Vite terminal for proxy logs

3. **Check Backend Logs:**
   - Make sure the backend server is running on port 5000
   - Check if requests are reaching the backend
   - Verify CORS is allowing the request origin

4. **Manual API URL Override (if needed):**
   - If automatic detection isn't working, you can manually set in `.env`:
     ```env
     VITE_API_URL=/api
     ```
   - Or use your computer's IP address:
     ```env
     VITE_API_URL=http://YOUR_IP:5000/api
     ```

### Browser-sync Not Starting (Method 2 only)

1. **Check if port 3000 is available:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Mac/Linux
   lsof -i :3000
   ```

2. **Try a different port:**
   Edit `bs-config.js` and change the `port` value.

## How It Works

### Method 1: Direct Vite Access

1. **Vite dev server** runs on port 5173 with `host: true` (accepts external connections)
2. **Vite proxy** automatically forwards `/api/*` requests to backend on `localhost:5000`
3. **API client** detects external access (non-localhost hostname) and uses relative URLs
4. External devices access directly on port 5173 - simple and straightforward!

### Method 2: Browser-Sync Proxy

1. **Browser-sync** runs on port 3000 and acts as a proxy
2. It forwards regular requests to **Vite** (port 5173) for the frontend
3. It intercepts `/api/*` requests and forwards them to the **backend** (port 5000)
4. Provides additional features like synchronized scrolling and live reload across devices

## Notes

- **Method 1 (Direct Vite)** is recommended for simplicity - no extra tools needed
- **Method 2 (Browser-sync)** provides enhanced features like synchronized browser actions across devices
- Both methods work seamlessly - choose based on your needs
- For production deployment, you don't need either method - use proper hosting instead
- The API client automatically handles URL configuration - no manual setup required!

