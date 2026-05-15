import { Module } from '@nestjs/common';
import { DjangoAiService } from './django-ai.service';

@Module({
  providers: [DjangoAiService],
  exports: [DjangoAiService],
})
export class DjangoAiModule {}