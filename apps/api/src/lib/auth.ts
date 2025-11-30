import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@fittrack/database";

const isProduction = process.env.NODE_ENV === "production";

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
      sameSite: isProduction ? "none" : "lax",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
