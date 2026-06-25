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
import { ApplicationsModule } from './applications/applications.module';
import { InterviewsModule } from './interviews/interviews.module';
import { UploadsModule } from './uploads/uploads.module';
import { DjangoAiModule } from './django-ai/django-ai.module';
import { GoogleMeetModule } from './google-meet/google-meet.module';
import { PrometheusModule } from './prometheus/prometheus.module';
import { BusinessMetricsService } from './monitoring/business-metrics/business-metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrometheusModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CandidateModule,
    RecruiterModule,
    HrManagerModule,
    JobsModule,
    AdminModule,
    EmailModule,
    ApplicationsModule,
    InterviewsModule,
    UploadsModule,
    DjangoAiModule,
    GoogleMeetModule,

  ],
  providers: [BusinessMetricsService],
})
export class AppModule {}