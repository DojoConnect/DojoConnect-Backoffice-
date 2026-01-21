/**
 * Socket.IO Authentication Middleware
 *
 * Validates JWT tokens during Socket.IO handshake and attaches user data to socket.
 */
import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import AppConfig from "../config/AppConfig.js";
import { UsersService } from "../services/users.service.js";
import type { TokenPayload } from "../utils/auth.utils.js";
import { Role } from "../constants/enums.js";

const { TokenExpiredError } = jwt;

/**
 * Extended socket data containing authenticated user information.
 */
export interface SocketData {
  userId: string;
  role: Role;
  email: string;
}

/**
 * Authenticated socket with user data attached.
 */
export type AuthenticatedSocket = Socket & {
  data: SocketData;
};

/**
 * Socket.IO authentication middleware.
 *
 * Verifies JWT token from the handshake auth object and attaches user info to socket.data.
 * Rejects connection if token is invalid or expired.
 *
 * Client should connect with:
 * ```javascript
 * const socket = io({
 *   auth: {
 *     token: "<JWT_ACCESS_TOKEN>"
 *   }
 * });
 * ```
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    // console.log("Handshake: ", socket.handshake)
    const handshake = socket.handshake
    const token = (handshake.auth?.token || handshake.headers.token|| handshake.query.token) as string | undefined;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const cleanToken = token.trim()

//     console.log("Token:", cleanToken)

//     // Decode without verification to see contents
// const decodedWithoutVerify = jwt.decode(cleanToken, {json: true});
// console.log("Decoded (no verify):", decodedWithoutVerify);

// // Check expiration
// if (decodedWithoutVerify && typeof decodedWithoutVerify === 'object') {
//   const now = Math.floor(Date.now() / 1000);
//   console.log("Current time:", now);
//   console.log("Token exp:", decodedWithoutVerify.exp);
//   console.log("Is expired?", now > (decodedWithoutVerify.exp || 0));
// }

    // Verify JWT token
    const decoded = jwt.verify(cleanToken, AppConfig.JWT_ACCESS_SECRET) as TokenPayload;

    // Verify user still exists and is active
    const user = await UsersService.getOneUserByID({ userId: decoded.userId });
    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user data to socket
    socket.data.userId = user.id;
    socket.data.role = user.role as Role;
    socket.data.email = user.email;
    socket.data.user = user;

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new Error("Token expired"));
    }
    return next(new Error("Invalid token"));
  }
};
