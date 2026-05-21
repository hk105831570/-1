import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryQuestionDto) {
    const { page = 1, pageSize = 50, courseId } = query;

    const where = { courseId };
    const [items, total] = await Promise.all([
      this.prisma.examQuestion.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.examQuestion.count({ where }),
    ]);

    // options 字段默认是 JSON 字符串，转成数组返回
    const parsed = items.map((item) => ({
      ...item,
      options: JSON.parse(item.options),
    }));

    return {
      items: parsed,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(dto: CreateQuestionDto) {
    // 验证课程存在
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, deletedAt: null },
    });
    if (!course) throw new NotFoundException('课程不存在');

    return this.prisma.examQuestion.create({
      data: {
        courseId: dto.courseId,
        questionType: dto.questionType,
        title: dto.title,
        options: JSON.stringify(dto.options),
        answer: dto.answer,
        score: dto.score,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async update(id: number, dto: UpdateQuestionDto) {
    const question = await this.prisma.examQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('题目不存在');

    const updateData: any = {};
    if (dto.questionType !== undefined) updateData.questionType = dto.questionType;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.options !== undefined) updateData.options = JSON.stringify(dto.options);
    if (dto.answer !== undefined) updateData.answer = dto.answer;
    if (dto.score !== undefined) updateData.score = dto.score;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    return this.prisma.examQuestion.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    const question = await this.prisma.examQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('题目不存在');

    await this.prisma.examQuestion.delete({ where: { id } });
    return { message: '已删除' };
  }
}
