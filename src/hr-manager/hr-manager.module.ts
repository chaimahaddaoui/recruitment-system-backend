import { Module } from '@nestjs/common';
import { HrManagerController } from './hr-manager.controller';

@Module({
  controllers: [HrManagerController],
})
export class HrManagerModule {}