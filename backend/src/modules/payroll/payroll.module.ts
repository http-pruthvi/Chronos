import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PayrollRepository } from './payroll.repository';

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, PayrollRepository],
  exports: [PayrollService, PayrollRepository],
})
export class PayrollModule {}
