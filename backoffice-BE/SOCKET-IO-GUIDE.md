# Dojo Connect - Real-time Chat Integration Guide

This document describes how to integrate with the Dojo Connect real-time chat system using Socket.IO.

## Quick Start

| Property | Value |
|----------|-------|
| **Namespace** | `/chats` |
| **Transport** | WebSocket (with polling fallback) |
| **Authentication** | JWT Bearer Token |

---

## Connection Setup

### Web (JavaScript/TypeScript)

```javascript
import { io } from "socket.io-client";

const socket = io("https://api.dojoconnect.com/chats", {
  auth: {
    token: "<JWT_ACCESS_TOKEN>"
  },
  transports: ["websocket", "polling"]
});

socket.on("connect", () => {
  console.log("Connected to chat:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
  // Handle: "Authentication required", "Token expired", "Invalid token"
});
```

### Flutter (Dart)

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io(
  'https://api.dojoconnect.com/chats',
  IO.OptionBuilder()
    .setTransports(['websocket', 'polling'])
    .setAuth({'token': jwtAccessToken})
    .build(),
);

socket.onConnect((_) {
  print('Connected to chat: ${socket.id}');
});

socket.onConnectError((error) {
  print('Connection error: $error');
});

socket.connect();
```

---

## Authentication

The server validates your JWT during the handshake. On success, you're automatically joined to all class chat rooms you have access to.

### Token Passing Options

```javascript
// Option 1: auth object (recommended)
io("/chats", { auth: { token: "your-jwt" } });

// Option 2: query parameter
io("/chats?token=your-jwt");

// Option 3: headers
io("/chats", { extraHeaders: { token: "your-jwt" } });
```

### Error Messages

| Error | Meaning |
|-------|---------|
| `Authentication required` | No token provided |
| `Token expired` | JWT has expired, refresh and reconnect |
| `Invalid token` | JWT is malformed or invalid |
| `User not found` | User account no longer exists |

---

## Events

### Server → Client

#### `message:new`
Emitted when a new message is sent to a class you're a member of.

```typescript
interface MessageNewPayload {
  id: string;           // Message UUID
  classId?: string;     // Class UUID (for class group chats)
  senderId: string;     // Sender's user UUID
  senderName: string;   // Sender's full name
  senderAvatar: string | null;
  content: string;      // Message text
  createdAt: string;    // ISO 8601 timestamp
}
```

**Example:**
```javascript
socket.on("message:new", (message) => {
  console.log(`[${message.classId}] ${message.senderName}: ${message.content}`);
});
```

#### `typing:start`
Emitted when another user starts typing.

```typescript
interface TypingPayload {
  userId: string;
  classId: string;
}
```

#### `typing:stop`
Emitted when another user stops typing.

```typescript
interface TypingPayload {
  userId: string;
  classId: string;
}
```

---

### Client → Server

#### `typing:start`
Notify others you're typing.

```javascript
socket.emit("typing:start", { classId: "class-uuid-here" });
```

#### `typing:stop`
Notify others you stopped typing.

```javascript
socket.emit("typing:stop", { classId: "class-uuid-here" });
```

---

## Room Structure

Users are automatically joined to rooms based on their role and class memberships:

| Role | Rooms Joined |
|------|--------------|
| **DojoAdmin** | All classes in their dojo |
| **Instructor** | Classes they're assigned to |
| **Parent** | Classes their children are enrolled in |
| **Child** | Classes they're enrolled in |

Room naming: `class:{classId}`

---

## REST API Endpoints

Messages are sent via REST (source of truth), then broadcasted via Socket.IO.

### Send Message
```http
POST /api/classes/:classId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello everyone!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "classId": "class-uuid",
    "senderId": "user-uuid",
    "senderName": "John Doe",
    "senderAvatar": "https://...",
    "content": "Hello everyone!",
    "createdAt": "2026-01-21T18:30:00.000Z"
  }
}
```

### Get Messages (Paginated)
```http
GET /api/classes/:classId/messages?limit=50&cursor=2026-01-21T18:00:00.000Z
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "nextCursor": "2026-01-21T17:30:00.000Z",
    "hasMore": true
  }
}
```

---

## Complete Integration Example

### Web App

```javascript
import { io } from "socket.io-client";

class ChatService {
  socket = null;
  
  connect(token) {
    this.socket = io("https://api.dojoconnect.com/chats", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    this.socket.on("connect", () => {
      console.log("Chat connected");
    });
    
    this.socket.on("message:new", (message) => {
      // Update UI with new message
      this.onNewMessage?.(message);
    });
    
    this.socket.on("typing:start", ({ userId, classId }) => {
      this.onTypingStart?.(userId, classId);
    });
    
    this.socket.on("typing:stop", ({ userId, classId }) => {
      this.onTypingStop?.(userId, classId);
    });
  }
  
  startTyping(classId) {
    this.socket?.emit("typing:start", { classId });
  }
  
  stopTyping(classId) {
    this.socket?.emit("typing:stop", { classId });
  }
  
  disconnect() {
    this.socket?.disconnect();
  }
}
```

### Flutter App

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  late IO.Socket socket;
  Function(Map<String, dynamic>)? onNewMessage;
  Function(String userId, String classId)? onTypingStart;
  Function(String userId, String classId)? onTypingStop;

  void connect(String token) {
    socket = IO.io(
      'https://api.dojoconnect.com/chats',
      IO.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .setAuth({'token': token})
        .enableReconnection()
        .setReconnectionAttempts(5)
        .setReconnectionDelay(1000)
        .build(),
    );

    socket.onConnect((_) => print('Chat connected'));
    
    socket.on('message:new', (data) {
      onNewMessage?.call(data);
    });
    
    socket.on('typing:start', (data) {
      onTypingStart?.call(data['userId'], data['classId']);
    });
    
    socket.on('typing:stop', (data) {
      onTypingStop?.call(data['userId'], data['classId']);
    });

    socket.connect();
  }

  void startTyping(String classId) {
    socket.emit('typing:start', {'classId': classId});
  }

  void stopTyping(String classId) {
    socket.emit('typing:stop', {'classId': classId});
  }

  void disconnect() {
    socket.disconnect();
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Not receiving messages | Verify you're connected to `/chats` namespace |
| Connection rejected | Check JWT is valid and not expired |
| Messages appear after refresh only | Ensure Socket.IO is connected before sending messages |
| Reconnection loop | Token might be expired; refresh token and reconnect |
