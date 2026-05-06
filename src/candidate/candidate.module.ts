import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { ApplicationsModule } from 'src/applications/applications.module';

@Module({
  controllers: [CandidateController],
  imports: [ApplicationsModule],
})
export class CandidateModule {}