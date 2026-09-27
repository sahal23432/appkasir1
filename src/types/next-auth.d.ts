import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "kasir";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    role: "admin" | "kasir";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "admin" | "kasir";
  }
}
