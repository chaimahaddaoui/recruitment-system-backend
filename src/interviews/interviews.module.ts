import { Module } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; 
import { GoogleMeetModule } from '../google-meet/google-meet.module';



@Module({
  imports: [PrismaModule, EmailModule, GoogleMeetModule],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}