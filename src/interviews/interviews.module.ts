import { Module } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; 
@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}