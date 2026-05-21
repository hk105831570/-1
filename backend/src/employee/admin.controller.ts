import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { QueryStudyRecordDto } from './dto/query-study-record.dto';

@ApiTags('管理员端')
@Controller('admin')
export class AdminRecordsController {
  constructor(private employeeService: EmployeeService) {}

  @Get('study-records')
  @ApiOperation({ summary: '查看所有员工学习记录' })
  async getStudyRecords(@Query() query: QueryStudyRecordDto) {
    return this.employeeService.getAllStudyRecords(query);
  }
}
