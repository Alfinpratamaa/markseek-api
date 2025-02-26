import Elysia from "elysia";
import {
  googleAuthCallback,
  login,
  logOut,
  protectedController,
  redirectToGoogleAuth,
  register,
  requestForgotPassword,
  resetPassword,
} from "../controllers/authController";
import jwt from "@elysiajs/jwt";
import { JWT_SECRET } from "../config/env";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../utils/constants";

export const authRouter = new Elysia()
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
  .post("/register", register)
  .post("/login", login)
  .get("/google", redirectToGoogleAuth)
  .get("/google/callback", googleAuthCallback)
  .post("/forget-password", requestForgotPassword)
  .post("/reset-password", resetPassword)
  .get("/logout", logOut)
  .get("/protected", protectedController);
