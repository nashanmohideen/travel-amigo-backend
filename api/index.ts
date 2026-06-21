import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "../src/app.module";
import { ApiErrorFilter } from "../src/common/filters/api-error.filter";
import express, { type Request, type Response } from "express";

const expressServer = express();

/**
 * Bootstrap NestJS once per cold start. Vercel reuses the module between
 * warm invocations, so bootstrapPromise is only awaited on the first request.
 *
 * NOTE: @vendia/serverless-express is intentionally NOT used here.
 * That library is an AWS Lambda adapter and throws
 * "Unable to determine event source" on Vercel, which passes plain
 * Node.js IncomingMessage / ServerResponse objects — not Lambda events.
 * The Express adapter handles Vercel's req/res directly.
 */
const bootstrapPromise = (async () => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
    { logger: ["error", "warn"] }
  );

  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: config.get<string>("CLIENT_URL") ?? "*",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new ApiErrorFilter());

  await app.init();
})();

export default async function handler(req: Request, res: Response) {
  await bootstrapPromise;
  expressServer(req, res);
}
