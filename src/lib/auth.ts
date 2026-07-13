// ─────────────────────────────────────────────────────────────
// NextAuth configuration.
//   • Google & Apple OAuth
//   • Phone number + OTP via a Credentials provider (verified through the
//     Twilio Verify API in `verifyOtp`).
// Sessions are JWT-based; on sign-in we mirror the user into Supabase.
// ─────────────────────────────────────────────────────────────

import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";

/** Verify an OTP against Twilio Verify. Returns true when approved. */
async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !service) return false;

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${service}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      },
      body: new URLSearchParams({ To: phone, Code: code }),
    },
  );
  if (!res.ok) return false;
  const data = await res.json();
  return data.status === "approved";
}

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone (OTP)",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null;
        const ok = await verifyOtp(credentials.phone, credentials.code);
        if (!ok) return null;
        return { id: `phone:${credentials.phone}`, name: credentials.phone };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};
