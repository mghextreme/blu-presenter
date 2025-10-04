import { Socket } from "socket.io";

export interface AuthenticatedSocket extends Socket {
  userId?: number;
  orgId?: number;
  sessionId?: number;
}
