import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { comparePassword } from "./auth-utils";
import { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin / kasir" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan password wajib diisi");
        }

        const user = await prisma.user.findFirst({
          where: { username: credentials.username },
        });

        if (!user || !user.password) {
          throw new Error("Pengguna tidak ditemukan atau kredensial salah");
        }

        // Cek kecocokan password (mendukung plain text fallback jika database lama belum di-hash, atau bcrypt)
        let isValid = false;
        if (user.password === credentials.password) {
          isValid = true;
        } else {
          try {
            isValid = await comparePassword(credentials.password, user.password);
          } catch {
            isValid = false;
          }
        }

        if (!isValid) {
          throw new Error("Password salah");
        }

        return {
          id: String(user.rfid_id),
          name: user.username,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
