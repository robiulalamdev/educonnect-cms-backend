import { FastifyInstance } from "fastify";
import { Server, Socket } from "socket.io";
import { jwtDecrypt } from "jose";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

const adminAccessSecret = new TextEncoder().encode(env.ADMIN_JWT_ACCESS_SECRET);
const userAccessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

/**
 * Socket.io Manager
 * Handles real-time events, authentication, and room management.
 */
export class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;

  // Presence tracking — in-memory for real-time status, DB `last_seen_at`
  // persists the last offline time across restarts.
  private onlineUsers = new Set<string>();
  private socketUsers = new Map<string, string>(); // socketId -> userId

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
        // Fastify signs like "s:<value>.<signature>". The value is a compact
        // JWE that itself contains dots, so only strip the signature after
        // the LAST dot and keep the full token.
        if (token.startsWith("s%3A") || token.startsWith("s:")) {
          token = decodeURIComponent(token).slice(2);
          const lastDot = token.lastIndexOf(".");
          if (lastDot > 0) token = token.slice(0, lastDot);
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

      // 3. Presence — mark online and notify everyone (e.g. chat headers)
      const wasOnline = this.onlineUsers.has(userId);
      this.onlineUsers.add(userId);
      this.socketUsers.set(socket.id, userId);
      this.broadcastPresence(userId, true, undefined, wasOnline);

      socket.on("join_chat", (chatId: string) => {
        socket.join(`chat_${chatId}`);
        // Send the current presence snapshot of this chat's members to the joiner
        this.emitChatPresence(chatId, socket);
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

      socket.on("join_post", (postId: string) => {
        socket.join(`post_${postId}`);
      });

      socket.on("leave_post", (postId: string) => {
        socket.leave(`post_${postId}`);
      });

      socket.join("stories_feed");

      socket.on("disconnect", () => {
        console.log(`[Socket] User disconnected: ${userId}`);
        this.onlineUsers.delete(userId);
        this.socketUsers.delete(socket.id);
        // Persist last seen so it survives restarts
        prisma.user.update({
          where: { id: userId },
          data: { last_seen_at: new Date() },
        }).catch(() => {});
        this.broadcastPresence(userId, false, new Date());
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
   * Emit an event directly to a single user's personal room
   */
  emitToUser(userId: string, event: string, data: any) {
    this.io?.to(`user_${userId}`).emit(event, data);
  }

  /**
   * Is a user currently online (connected via socket)?
   */
  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Broadcast a presence change to every connected client so chat UIs can
   * update "online now / last seen" in real time.
   */
  private broadcastPresence(userId: string, online: boolean, lastSeen?: Date, wasOnline = false) {
    // Only broadcast connect events for genuinely new connections
    if (online && wasOnline) return;
    this.io?.emit("presence_update", { userId, online, last_seen: lastSeen ?? null });
  }

  /**
   * Send a snapshot of the given chat's member presence to a single socket
   * (used right after joining a chat room).
   */
  private async emitChatPresence(chatId: string, socket: Socket) {
    try {
      const participants = await prisma.chatParticipant.findMany({
        where: { chat_id: chatId },
        select: { user_id: true },
      });
      const snapshot: Record<string, { online: boolean; last_seen: string | null }> = {};
      for (const p of participants) {
        const user = await prisma.user.findUnique({
          where: { id: p.user_id },
          select: { last_seen_at: true },
        });
        snapshot[p.user_id] = {
          online: this.onlineUsers.has(p.user_id),
          last_seen: user?.last_seen_at?.toISOString() ?? null,
        };
      }
      socket.emit("presence_snapshot", { chatId, members: snapshot });
    } catch (err) {
      console.error("[Socket] presence snapshot failed", err);
    }
  }

  /**
   * Broadcast real-time statistics update
   */
  emitStatsUpdate(data: any) {
    this.io?.to("admin_dashboard").emit("stats_updated", data);
  }
}

export const socketManager = SocketManager.getInstance();
