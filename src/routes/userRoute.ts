import { getPayloadJwt } from "./../utils/auth";
import jwt from "@elysiajs/jwt";
import Elysia, { error } from "elysia";
import { JWT_SECRET } from "../config/env";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../utils/constants";
import prisma from "../db/db";

export const userRouter = new Elysia()
  .use(
    jwt({
      name: "accessJwt",
      secret: JWT_SECRET,
      exp: ACCESS_TOKEN_EXPIRES_IN,
    })
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: JWT_SECRET,
      exp: REFRESH_TOKEN_EXPIRES_IN,
    })
  )
  .get("/me", async ({ refreshJwt, cookie, headers }: any) => {
    const cookieRefreshToken = cookie.refreshToken.initial.value;
    if (!cookieRefreshToken) {
      return error(401, { message: "Unauthorized", memek: cookieRefreshToken });
    }

    const refreshToken = await getPayloadJwt(headers.authorization, refreshJwt);
    console.log("Refresh Token", refreshToken);
    if (!refreshToken) {
      return error(401, { message: "there is no refresh token" });
    }
    const payload = await refreshJwt.verify(refreshToken);
    console.log("Payload", payload);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.id,
      },
      select: {
        password: false,
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
    if (!user) {
      return error(404, { message: "User not found" });
    }
    return {
      message: "User found",
      user,
    };
  });
