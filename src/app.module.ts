import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CandidateModule } from './candidate/candidate.module';
import { RecruiterModule } from './recruiter/recruiter.module';
import { HrManagerModule } from './hr-manager/hr-manager.module';
import { JobsModule } from './jobs/jobs.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CandidateModule,
    RecruiterModule,
    HrManagerModule,
    JobsModule,
    AdminModule,
    EmailModule,
  ],
})
export class AppModule {}