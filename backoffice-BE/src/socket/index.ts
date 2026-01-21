/**
 * Socket.IO Server Setup
 *
 * ARCHITECTURE NOTES:
 * -------------------
 * This implementation assumes a SINGLE BACKEND INSTANCE. Socket.IO rooms are
 * stored in-memory only and are not shared across instances.
 *
 * SINGLE INSTANCE LIMITATION:
 * - Socket.IO state (rooms, connected sockets) lives in this process's memory
 * - If you deploy multiple instances behind a load balancer, users connected
 *   to different instances will NOT receive each other's messages
 *
 * UPGRADE PATH TO HORIZONTAL SCALING:
 * To support multiple backend instances, integrate @socket.io/redis-adapter:
 *
 * ```typescript
 * import { createAdapter } from "@socket.io/redis-adapter";
 * import { createClient } from "redis";
 *
 * const pubClient = createClient({ url: process.env.REDIS_URL });
 * const subClient = pubClient.duplicate();
 * await Promise.all([pubClient.connect(), subClient.connect()]);
 * io.adapter(createAdapter(pubClient, subClient));
 * ```
 *
 * With Redis adapter:
 * - Event emissions are broadcasted to all instances via Redis pub/sub
 * - Any instance can emit to any room and all subscribed clients receive it
 * - Session affinity ("sticky sessions") is still recommended for best performance
 */

import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware, type AuthenticatedSocket } from "./auth.middleware.js";
import * as dbService from "../db/index.js";
import { Role } from "../constants/enums.js";
import { ClassService } from "../services/class.service.js";
import AppConfig from "../config/AppConfig.js";

let io: Server | null = null;

/**
 * Initializes the Socket.IO server and attaches it to the HTTP server.
 *
 * @param httpServer - The HTTP server instance to attach Socket.IO to
 * @returns The Socket.IO Server instance
 */
export const initializeSocketIO = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: AppConfig.WEB_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Apply JWT authentication middleware
  io.use(socketAuthMiddleware);

  // Handle new connections
  io.on("connection", async (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, role } = authSocket.data;

    console.log(`Socket connected: ${socket.id} (User: ${userId}, Role: ${role})`);

    // Join class rooms based on user role and memberships
    await joinClassRooms(authSocket);

    // Handle typing indicators
    socket.on("typing:start", ({classId}:{classId: string}) => {
      socket.to(`class:${classId}`).emit("typing:start", {
        userId,
        classId,
      });
    });

    socket.on("typing:stop", (classId: string) => {
      socket.to(`class:${classId}`).emit("typing:stop", {
        userId,
        classId,
      });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

/**
 * Gets the Socket.IO server instance.
 * Returns null if Socket.IO has not been initialized.
 */
export const getSocketIO = (): Server | null => {
  return io;
};

/**
 * Emits an event to a specific class room.
 *
 * @param classId - The class ID to emit to
 * @param event - The event name
 * @param payload - The event payload
 */
export const emitToClassRoom = (classId: string, event: string, payload: unknown): void => {
  if (io) {
    io.to(`class:${classId}`).emit(event, payload);
  }
};

/**
 * Joins a socket to all class rooms the user is a member of.
 *
 * Room naming convention: `class:{classId}`
 *
 * Membership is determined by role:
 * - DojoAdmin: All classes in their dojo
 * - Instructor: Classes they are assigned to
 * - Parent: Classes their children are enrolled in
 * - Child: Classes they are enrolled in
 */
const joinClassRooms = async (socket: AuthenticatedSocket): Promise<void> => {
  const { userId, role } = socket.data;

  try {
    const classIds = await getClassIdsForUser(userId, role);

    // Join all class rooms
    for (const classId of classIds) {
      socket.join(`class:${classId}`);
    }

    console.log(`User ${userId} joined ${classIds.length} class room(s)`);
  } catch (error) {
    console.error(`Failed to join class rooms for user ${userId}:`, error);
  }
};

/**
 * Gets all class IDs a user can access based on their role.
 */
const getClassIdsForUser = async (userId: string, role: Role): Promise<string[]> => {
  return await dbService.runInTransaction(async (tx) => {
    const classes = await ClassService.getUserClasses(userId, tx);
    return classes.map((c) => c.id);
  });
};
