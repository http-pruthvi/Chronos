import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { LeavesRepository } from './leaves.repository';

@Module({
  controllers: [LeavesController],
  providers: [LeavesService, LeavesRepository],
  exports: [LeavesService, LeavesRepository],
})
export class LeavesModule {}
