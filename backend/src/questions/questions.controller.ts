import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';

@ApiTags('题库管理')
@Controller('admin/questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: '获取题目列表（按课程）' })
  async findAll(@Query() query: QueryQuestionDto) {
    return this.questionsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: '新增题目' })
  async create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑题目' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除题目' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }
}
