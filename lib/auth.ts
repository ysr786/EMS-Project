import NextAuth, { type Session, type User } from "next-auth";
import { type JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";

const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        try {
          await connectDB();
          const admin = await Admin.findOne({ email: credentials?.email as string }).lean<{ _id: any; name: string; email: string; password: string; role: string; mustChangePassword: boolean }>();
          if (!admin) return null;
          const valid = await bcrypt.compare(credentials?.password as string, admin.password);
          if (!valid) return null;
          return { id: admin._id.toString(), name: admin.name, email: admin.email, role: admin.role, mustChangePassword: admin.mustChangePassword ?? false };
        } catch (err) {
          console.error("[authorize error]", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session.user as any).mustChangePassword = token.mustChangePassword;
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
