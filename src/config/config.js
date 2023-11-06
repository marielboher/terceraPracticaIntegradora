import dotenv from "dotenv";
import { Command } from "commander";

const program = new Command();

program
  .option("-p <port>", "Puerto del servidor", 9090)
  .option("--mode <mode>", "Modo de trabajo", "development")
  .parse(process.argv);

const environment = program.opts().mode;

dotenv.config({
  path:
    environment === "production"
      ? "./src/config/.env.production"
      : "./src/config/.env.development",
});

export const ENV_CONFIG = {
  port: process.env.PORT,
  environment: environment,
  mongoUrl: process.env.MONGODB_CNX_STR,
  jwtSecret: process.env.JWT_SECRET,
  secretKeySession: process.env.SECRET_KEY_SESSION,
  clientIdGithub: process.env.CLIENT_ID_GITHUB,
  clientSecretGithub: process.env.CLIENT_SECRET_GITHUB,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  persistence: process.env.PERSISTENCE,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASS,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioNumber: process.env.TWILIO_SMS_NUMBER,
};
