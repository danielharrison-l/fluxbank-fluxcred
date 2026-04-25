import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) =>
      origin.trim().replace(/^['"]+|['"]+$/g, "").replace(/\/$/, ""),
    )
    .filter(Boolean);

  if (!configuredOrigins?.length) {
    throw new Error(
      "CORS_ORIGIN must be defined in environment variables",
    );
  }

  return configuredOrigins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: allowedOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle("FluxCred API")
    .setDescription("FluxCred backend API")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        in: "header",
      },
      "jwt",
    )
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  SwaggerModule.setup("docs", app, openApiDocument, {
    jsonDocumentUrl: "api-json",
  });
  app.use(
    "/reference",
    apiReference({
      url: "http://localhost:3000/api-json",
    }),
  );

  if (!process.env.PORT || !process.env.HOST) {
    throw new Error("PORT and HOST must be defined in environment variables");
  }

  await app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(
      `Server is running on http://${process.env.HOST}:${process.env.PORT}`,
    );
  });
}

bootstrap();
