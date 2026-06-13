import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "../src/app.module";
import { ApiErrorFilter } from "../src/common/filters/api-error.filter";
import serverlessExpress from "@vendia/serverless-express";
import express, { type Request, type Response } from "express";

const expressServer = express();
let handler: ReturnType<typeof serverlessExpress>;

async function bootstrap() {
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
  handler = serverlessExpress({ app: expressServer });
}

const bootstrapPromise = bootstrap();

export default async function (req: Request, res: Response) {
  await bootstrapPromise;
  return handler(req, res);
}
