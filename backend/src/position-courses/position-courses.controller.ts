import { Controller, Get, Post, Delete, Param, Body, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PositionCoursesService } from './position-courses.service';
import { CreatePositionCourseDto, BatchSetPositionCoursesDto } from './dto/create-position-course.dto';

@ApiTags('岗位课程映射')
@Controller('admin/position-courses')
export class PositionCoursesController {
  constructor(private service: PositionCoursesService) {}

  @Get()
  @ApiOperation({ summary: '获取岗位课程映射（可按岗位筛选）' })
  async findAll(@Query('position') position?: string) {
    return this.service.findAll(position);
  }

  @Get('positions')
  @ApiOperation({ summary: '获取所有岗位名（含员工表中的岗位）' })
  async getPositions() {
    return this.service.getPositions();
  }

  @Post('positions')
  @ApiOperation({ summary: '创建新岗位' })
  async createPosition(@Body('name') name: string) {
    if (!name || !name.trim()) throw new BadRequestException('岗位名不能为空');
    return this.service.createPosition(name.trim());
  }

  @Post()
  @ApiOperation({ summary: '添加岗位课程映射' })
  async create(@Body() dto: CreatePositionCourseDto) {
    return this.service.create(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量设置岗位课程' })
  async batchSet(@Body() dto: BatchSetPositionCoursesDto) {
    return this.service.batchSet(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除映射' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
