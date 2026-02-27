/* import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap(); */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // supprime champs non autorisés
      forbidNonWhitelisted: true, // génère une erreur si des champs non autorisés sont présents
      transform: true, 
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

