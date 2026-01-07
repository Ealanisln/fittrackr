import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@fittrack/database";

const isProduction = process.env.NODE_ENV === "production" ||
  process.env.AUTH_URL?.includes("fittrackr.me") ||
  process.env.CLIENT_URL?.includes("fittrackr.me");

console.log("🔐 Auth config:", {
  isProduction,
  NODE_ENV: process.env.NODE_ENV,
  AUTH_URL: process.env.AUTH_URL,
  CLIENT_URL: process.env.CLIENT_URL
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.AUTH_URL || "http://localhost:3001",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:5173"],
  advanced: {
    crossSubDomainCookies: {
      enabled: isProduction,
      domain: isProduction ? ".fittrackr.me" : undefined,
    },
    defaultCookieAttributes: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
