import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; 
@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}