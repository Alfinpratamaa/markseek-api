// // middleware/auth.ts
// import { Context, Elysia } from "elysia";
// import { JWT_SECRET } from "../config/env";
// import jwt from "@elysiajs/jwt";
// import {
//   ACCESS_TOKEN_EXPIRES_IN,
//   REFRESH_TOKEN_EXPIRES_IN,
// } from "../utils/constants";

// interface JWTPayload {
//   id: string;
//   email: string;
//   role: "admin" | "user";
// }

// // Define the shape of our derived context
// interface AuthDerived {
//   getCurrentUser: () => Promise<JWTPayload | null>;
// }

// interface AuthContext {
//   user: JWTPayload;
// }

// // Create the base middleware with JWT
// const jwtMiddleware = new Elysia().use(
//   jwt({
//     name: "jwt",
//     secret: JWT_SECRET,
//   })
// );

// // Export type for JWT context
// type JWTContext = typeof jwtMiddleware.derive;

// // Create and export the auth middleware
// export const authMiddleware = new Elysia()
//   .use(
//     jwt({
//       name: "accessJwt",
//       secret: JWT_SECRET,
//       exp: ACCESS_TOKEN_EXPIRES_IN,
//     })
//   )
//   .use(
//     jwt({
//       name: "refreshJwt",
//       secret: JWT_SECRET,
//       exp: REFRESH_TOKEN_EXPIRES_IN,
//     })
//   )
//   .derive(async ({ accessJwt, headers }) => {
//     return {
//       getCurrentUser: async () => {
//         const authHeader = headers["authorization"];
//         const token = authHeader?.startsWith("Bearer ")
//           ? authHeader.slice(7)
//           : undefined;

//         const payload = await accessJwt.verify(token);
//         console.log("Payload : ", payload);

//         if (!payload || !payload.id) {
//           return null;
//         }

//         return payload as unknown as JWTPayload;
//       },
//     };
//   });

// export const requireAuth = new Elysia()
//   .use(authMiddleware)
//   .derive(async (context : Context) => {
//     const user = await context.request.headers.get("Authrorization")
//     if (!user) {
//       throw new Error("Unauthorized");
//     }
//     return { user };
//   });

// export const requireAdmin = new Elysia()
//   .use(requireAuth)
//   .derive(async (context) => {
//     const { user } = context as unknown as AuthContext;
//     if (user.role !== "admin") {
//       throw new Error("Unauthorized");
//     }
//     return { user };
//   });

// // Export useful types
// export type { JWTPayload, AuthContext };
// export type AuthHandler = {
//   user: JWTPayload;
// };
