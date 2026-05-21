import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { AdminRecordsController } from './admin.controller';
import { EmployeeService } from './employee.service';

@Module({
  controllers: [EmployeeController, AdminRecordsController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
