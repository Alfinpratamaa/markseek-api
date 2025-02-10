import prisma from "../db/db";
import { comparePassword, hashPassword } from "../utils/bcyrpt";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/mailer";
import { createSuccessResponse } from "../libs/Response";
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
import { error, redirect } from "elysia";

export const register = async ({ body, error }: any) => {
  const { name, email, password } = body;

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (existingUser) return error(400, "Email sudah terdaftar");

  const hashedPassword = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.verificationToken.create({
    data: {
      token,
      identifier: newUser.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  await sendVerificationEmail(email, token, "verify");

  return createSuccessResponse<void>("User created successfully", undefined);
};

export const login = async ({ body, accessJwt, refreshJwt, cookie }: any) => {
  const { email, password } = body;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user)
    return error(404, "user tidak ditemukan, silahkan daftar terlebih dahulu");

  const isPasswordMatch = await comparePassword(password, user.password!);
  if (!isPasswordMatch) return error(401, "Email atau password salah");

  const isEmailVerified = !!user.emailVerified;
  if (!isEmailVerified)
    return error(401, "Email belum diverifikasi, silahkan cek email anda");

  const rememberMe = body.rememberMe || false;
  const accessToken = await accessJwt.sign({
    id: user.id.toString(),
    email: user.email,
    role: user.role,
  });
  let refreshToken = "";

  if (rememberMe) {
    refreshToken = await refreshJwt.sign({
      id: user.id.toString(),
      email: user.email,
      role: user.role,
    });
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

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token,
    },
  });

  if (!verificationToken || new Date(verificationToken.expires) < new Date()) {
    return error(404, "Token tidak valid");
  }

  const isVerified = await prisma.user.findFirst({
    where: {
      id: verificationToken.identifier,
      emailVerified: {
        not: null,
      },
    },
  });

  if (isVerified) {
    setTimeout(() => {
      redirect("/login", 302);
    }, 5000);
    return createSuccessResponse<void>("Email sudah diverifikasi", undefined);
  }

  await prisma.user.update({
    where: {
      id: verificationToken.identifier,
    },
    data: {
      emailVerified: new Date(),
    },
  });

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

  const existingUser = await prisma.user.findFirst({
    where: {
      email: data.email!,
    },
  });

  if (!existingUser) {
    const newUser = await prisma.user.create({
      data: {
        name: data.name!,
        email: data.email!,
        emailVerified: new Date(),
      },
    });

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
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (!user)
    return error(404, "User tidak ditemukan, silahkan daftar terlebih dahulu");

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      token,
      identifier: user.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  await sendVerificationEmail(email, token, "reset-password");
  return createSuccessResponse<void>("Email sent successfully", undefined);
};

export const resetPassword = async ({ body, query }: any) => {
  const { token } = query;
  const { password } = body;

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token,
    },
  });
  console.log("verify token : ", verificationToken);

  if (!verificationToken || new Date(verificationToken.expires) < new Date()) {
    return error(404, "Token tidak valid");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: {
      id: verificationToken.identifier,
    },
    data: {
      password: hashedPassword,
    },
  });
  return createSuccessResponse<void>("Password reset successfully", undefined);
};
