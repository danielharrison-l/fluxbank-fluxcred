import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
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
