import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, verificationTokens } from "../db/schema";
import { comparePassword, hashPassword } from "../utils/bcyrpt";
import crypto from "crypto";
import { User } from "../types";
import { sendVerificationEmail } from "../utils/mailer";
import { createErrorResponse, createSuccessResponse } from "../libs/Response";
import {
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NODE_ENV,
} from "../config/env";
import {
  ACCESS_TOKEN_EXPIRES_IN_MS,
  REFRESH_TOKEN_EXPIRES_IN_MS,
} from "../utils/constants";
import { google } from "googleapis";
import { redirect } from "elysia";

export const register = async ({ body, error }: any) => {
  const { name, email, password } = body;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existingUser) return error(400, "Email sudah terdaftar");

  const hashedPassword = await hashPassword(password);

  const [newUser] = (await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning()
    .execute()) as User[];

  const token = crypto.randomBytes(32).toString("hex");

  await db.insert(verificationTokens).values({
    identifier: newUser.id,
    token,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  });

  await sendVerificationEmail(email, token, "verify-email");

  return createSuccessResponse<void>("User created successfully", undefined);
};

export const login = async ({ body, accessJwt, refreshJwt, cookie }: any) => {
  const { email, password } = body;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user)
    return createErrorResponse(
      "Email tidak terdaftar",
      "404",
      "error",
      "User not found"
    );

  const isPasswordMatch = await comparePassword(password, user.password!);
  if (!isPasswordMatch)
    return createErrorResponse(
      "Password salah",
      "401",
      "error",
      "Unauthorized"
    );

  const isEmailVerified = !!user.emailVerified;
  if (!isEmailVerified)
    return createErrorResponse(
      "Email belum diverifikasi",
      "401",
      "error",
      "Unauthorized"
    );

  const rememberMe = body.rememberMe || false;
  const accessToken = await accessJwt.sign({ id: user.id.toString(),email : user.email,role:user.role });
  let refreshToken = "";

  if (rememberMe) {
    refreshToken = await refreshJwt.sign({ id: user.id.toString(),email : user.email,role:user.role });
  }

  cookie.accessToken.set({
    value: accessToken,
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_EXPIRES_IN_MS,
    path: "/",
  });

  cookie.refreshToken.set({
    value: "",
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  if (rememberMe) {
    cookie.refreshToken.set({
      value: refreshToken,
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
      path: "/",
    });

    return createSuccessResponse<{
      accessToken: string;
      refreshToken: string;
    }>("Login successful", {
      accessToken,
      refreshToken,
    });
  }

  return createSuccessResponse<{ accessToken: string }>("Login successful", {
    accessToken,
  });
};

export const verifyEmail = async ({ query }: { query: { token: string } }) => {
  const { token } = query;

  const [verificationToken] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token));

  if (!verificationToken || new Date(verificationToken.expires) < new Date()) {
    return { status: 404, body: { message: "Token tidak valid" } };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, verificationToken.identifier));

  return { status: 200, body: { message: "Email berhasil diverifikasi" } };
};

const Oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const authorizationUrl = Oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  include_granted_scopes: true,
});

export const redirectToGoogleAuth = () => {
  return redirect(authorizationUrl, 302);
};

export const googleAuthCallback = async ({
  body,
  accessJwt,
  refreshJwt,
  cookie,
  query,
}: any) => {
  const { code } = query;
  const { tokens } = await Oauth2Client.getToken(code);
  Oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: Oauth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email!));

  if (!existingUser) {
    const [newUser] = (await db
      .insert(users)
      .values({
        name: data.name!,
        email: data.email!,
        emailVerified: new Date(),
        avatar: data.picture,
      })
      .returning()
      .execute()) as User[];

    const accessToken = await accessJwt.sign({ sub: newUser.id.toString() });
    const refreshToken = await refreshJwt.sign({ sub: newUser.id.toString() });

    cookie.accessToken.set({
      value: accessToken,
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_EXPIRES_IN_MS,
    });
    return createSuccessResponse<any>("Login successful", {
      accessToken,
      refreshToken,
    });
  }
};

export const requestForgotPassword = async ({ body }: any) => {
  const { email } = body;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user)
    return createErrorResponse(
      "Email tidak terdaftar",
      "404",
      "error",
      "User not found"
    );

  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(verificationTokens).values({
    identifier: user.id,
    token,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  });

  await sendVerificationEmail(email, token, "reset-password");
  return createSuccessResponse<void>("Email sent successfully", undefined);
};

export const resetPassword = async ({ body, query }: any) => {
  const { token } = query;
  const { password } = body;

  const [verificationToken] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token));

  console.log("verify token : ", verificationToken);

  if (!verificationToken || new Date(verificationToken.expires) < new Date()) {
    return createErrorResponse(
      "Token tidak valid",
      "404",
      "error",
      "Token not valid"
    );
  }

  const hashedPassword = await hashPassword(password);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, verificationToken.identifier));

  return createSuccessResponse<void>("Password reset successfully", undefined);
};
