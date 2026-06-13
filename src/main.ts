import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ApiErrorFilter } from "./common/filters/api-error.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");

  // CORS: accept only the configured frontend origin
  app.enableCors({
    origin: config.get<string>("CLIENT_URL") ?? "http://localhost:3000",
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

  const port = config.get<number>("PORT") ?? 3001;
  await app.listen(port);
  console.log(`Travel Amigo API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
