import { config } from "dotenv";

config({ path: ".env" });
const DATABASE_URL = process.env.DATABASE_URL!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;
const PORT = process.env.PORT!;
const APP_URL = process.env.APP_URL!;
const REDIRECT_URL = process.env.REDIRECT_URL!;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE!;
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD!;
const NODE_ENV = process.env.NODE_ENV!;

export {
  DATABASE_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  JWT_SECRET,
  PORT,
  APP_URL,
  REDIRECT_URL,
  EMAIL_SERVICE,
  EMAIL_USER,
  EMAIL_PASSWORD,
  NODE_ENV,
};
