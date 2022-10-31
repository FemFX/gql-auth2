import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as session from "express-session";
import * as cookieParser from "cookie-parser";
import * as connectRedis from "connect-redis";
import { redis } from "./redis";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const RedisStore = connectRedis(session);

  app.use(
    session({
      store: new RedisStore({
        client: redis as any,
      }),
      name: "jid",
      secret: process.env.SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 * 30, //30days
      },
    })
  );
  app.use(cookieParser());
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });
  await app.listen(process.env.PORT);
}
bootstrap();
