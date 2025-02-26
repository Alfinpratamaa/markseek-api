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

  if (user?.loginType === "google") {
    return error(400, "Silahkan login menggunakan google");
  }

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

export const redirectToGoogleAuth = async ({ cookie }: any) => {
  if (cookie.accessToken.initial.value || cookie.refreshToken.initial.value) {
    return redirect("/api/auth/protected", 302);
  }
  return redirect(authorizationUrl, 302);
};

export const googleAuthCallback = async ({
  accessJwt,
  refreshJwt,
  cookie,
  query,
}: any) => {
  if (cookie.accessToken.initial.value || cookie.refreshToken.initial.value) {
    return redirect("/api/auth/protected", 302);
  }

  try {
    if (!query.code || query.error === "access_denied") {
      return redirect("/api/auth/google");
    }

    const { tokens } = await Oauth2Client.getToken(query.code);
    Oauth2Client.setCredentials(tokens);
    console.log("code ", query.code);

    const oauth2 = google.oauth2({
      auth: Oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    let user = await prisma.user.findFirst({
      where: { email: data.email! },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: data.name!,
          email: data.email!,
          loginType: "google",
          avatar: data.picture! || "/default-avatar.png",
          emailVerified: new Date(),
        },
      });
    }

    const accessToken = await accessJwt.sign({ id: user.id.toString() });
    const refreshToken = await refreshJwt.sign({
      id: user.id.toString(),
    });

    cookie.accessToken.set({
      value: accessToken,
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_EXPIRES_IN_MS,
    });
    cookie.refreshToken.set({
      value: refreshToken,
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
    });

    console.log("Cookie", cookie.accessToken.initial.value);

    return redirect("/api/auth/protected", 302);
  } catch (e: any) {
    console.error("Google Auth Error:", e.message);
    return error(400, { message: "Google Auth Error: " + e.message });
  }
};

export const logOut = async ({ cookie }: any) => {
  cookie.accessToken.set({
    value: "",
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });

  cookie.refreshToken.set({
    value: "",
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
  return redirect("/api/auth/google", 302);
};

export const protectedController = async ({
  refreshJwt,
  error,
  cookie,
}: any) => {
  const cookieRefreshToken = cookie.refreshToken.initial.value;
  const payload = await refreshJwt.verify(cookieRefreshToken);

  const user = await prisma.user.findUnique({
    where: {
      id: payload?.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: false,
      avatar: true,
      address: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) return error(403, "User not authenticated");

  return {
    status: "success",
    data: {
      user,
    },
    code: 200,
  };
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
