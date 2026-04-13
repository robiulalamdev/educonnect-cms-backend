import { FastifyInstance } from "fastify";
import { Server, Socket } from "socket.io";
import { jwtDecrypt } from "jose";
import { env } from "./env.js";

const adminAccessSecret = new TextEncoder().encode(env.ADMIN_JWT_ACCESS_SECRET);
const userAccessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

/**
 * Socket.io Manager
 * Handles real-time events, authentication, and room management.
 */
export class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  initialize(fastify: FastifyInstance) {
    this.io = (fastify as any).io;

    this.io?.use(async (socket, next) => {
      try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) return next(new Error("AUTHENTICATION_FAILED"));

        // Manual cookie parsing (simplified)
        const getCookie = (name: string) => {
          const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        };

        // Note: For signed cookies, we'd need to unsign them here.
        // For simplicity in this real-time bridge, we expect the frontend 
        // to pass the raw token in a header or we manually unsign if needed.
        // Assuming we can extract the token:
        
        let token = getCookie(env.ADMIN_COOKIE_ACCESS_NAME) || getCookie(env.COOKIE_ACCESS_NAME);
        
        if (!token) return next(new Error("UNAUTHORIZED"));

        // If the cookie is signed (prefix s:), we need to unsign it.
        // Fastify signs like "s:token.signature"
        if (token.startsWith("s%3A")) {
           token = decodeURIComponent(token).slice(2).split(".")[0];
        }

        try {
          // Try Admin first
          const { payload: admin } = await jwtDecrypt(token, adminAccessSecret);
          (socket as any).admin = admin;
        } catch {
          // Try User
          const { payload: user } = await jwtDecrypt(token, userAccessSecret);
          (socket as any).user = user;
        }

        next();
      } catch (err) {
        next(new Error("AUTHENTICATION_FAILED"));
      }
    });

    this.io?.on("connection", (socket: Socket) => {
      const identity = (socket as any).admin || (socket as any).user;
      if (!identity) return socket.disconnect();

      const userId = identity.userId || identity.id;
      console.log(`[Socket] User connected: ${userId}`);

      // 1. Join personal room
      socket.join(`user_${userId}`);

      // 2. Join role-specific rooms
      if ((socket as any).admin) {
        socket.join("admin_dashboard");
      }

      socket.on("join_chat", (chatId: string) => {
        socket.join(`chat_${chatId}`);
      });

      socket.on("leave_chat", (chatId: string) => {
        socket.leave(`chat_${chatId}`);
      });

      socket.on("typing", (data: { chatId: string; name: string }) => {
        socket.to(`chat_${data.chatId}`).emit("user_typing", { 
          chatId: data.chatId, 
          name: data.name 
        });
      });

      socket.on("disconnect", () => {
        console.log(`[Socket] User disconnected: ${userId}`);
      });
    });
  }

  /**
   * Emit event to a specific room
   */
  emitToRoom(room: string, event: string, data: any) {
    this.io?.to(room).emit(event, data);
  }

  /**
   * Broadcast real-time statistics update
   */
  emitStatsUpdate(data: any) {
    this.io?.to("admin_dashboard").emit("stats_updated", data);
  }
}

export const socketManager = SocketManager.getInstance();
