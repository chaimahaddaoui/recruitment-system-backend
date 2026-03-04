import { Module } from '@nestjs/common';
import { RecruiterController } from './recruiter.controller';

@Module({
  controllers: [RecruiterController],
})
export class RecruiterModule {}