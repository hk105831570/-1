import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { UpdateProgressDto } from './dto/progress.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/strategies/jwt.strategy';

@ApiTags('员工端')
@Controller('employee')
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get('courses')
  @ApiOperation({ summary: '获取我的课程列表（按岗位派课）' })
  async getMyCourses(@CurrentUser() user: JwtPayload) {
    return this.employeeService.getMyCourses(user.sub);
  }

  @Post('progress')
  @ApiOperation({ summary: '更新视频观看进度（增量上报）' })
  async updateProgress(
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employeeService.updateProgress(user.sub, dto);
  }

  @Get('exam/:courseId')
  @ApiOperation({ summary: '获取考试题目（不含答案）' })
  async getExamQuestions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employeeService.getExamQuestions(courseId, user.sub);
  }

  @Post('exam/submit')
  @ApiOperation({ summary: '提交考试并判分' })
  async submitExam(
    @Body() dto: SubmitExamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employeeService.submitExam(user.sub, dto);
  }

  @Get('records')
  @ApiOperation({ summary: '获取我的学习记录' })
  async getMyRecords(@CurrentUser() user: JwtPayload) {
    return this.employeeService.getMyRecords(user.sub);
  }
}
