import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePositionCourseDto, BatchSetPositionCoursesDto } from './dto/create-position-course.dto';

@Injectable()
export class PositionCoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(position?: string) {
    const where: any = {};
    if (position) where.position = position;

    const items = await this.prisma.positionCourse.findMany({
      where,
      include: { course: { select: { id: true, name: true, category: true } } },
      orderBy: [{ position: 'asc' }, { courseId: 'asc' }],
    });

    // 按岗位分组
    if (!position) {
      const grouped: Record<string, any[]> = {};
      for (const item of items) {
        if (!grouped[item.position]) grouped[item.position] = [];
        grouped[item.position].push(item);
      }
      return grouped;
    }

    return items;
  }

  async getPositions() {
    const [fromCourses, fromUsers] = await Promise.all([
      this.prisma.positionCourse.findMany({
        select: { position: true },
        distinct: ['position'],
        orderBy: { position: 'asc' },
      }),
      this.prisma.user.findMany({
        select: { position: true },
        where: { position: { not: null }, deletedAt: null },
        distinct: ['position'],
      }),
    ]);
    const posSet = new Set([
      ...fromCourses.map((r) => r.position),
      ...fromUsers.map((r) => r.position as string),
    ]);
    return Array.from(posSet).sort();
  }

  async createPosition(name: string) {
    // 检查是否已有员工使用此岗位
    const existingUser = await this.prisma.user.findFirst({
      where: { position: name, deletedAt: null },
    });
    if (existingUser) return { name };

    // 尝试从已配置的课程中查找
    const existing = await this.prisma.positionCourse.findFirst({
      where: { position: name },
    });
    if (existing) return { name };

    // 在 position_courses 中插入一条空映射以占位
    const firstCourse = await this.prisma.course.findFirst({ where: { deletedAt: null } });
    if (firstCourse) {
      await this.prisma.positionCourse.create({
        data: { position: name, courseId: firstCourse.id, isRequired: false },
      });
    }
    return { name };
  }

  async create(dto: CreatePositionCourseDto) {
    // 检查是否已存在
    const existing = await this.prisma.positionCourse.findUnique({
      where: {
        uk_position_course: {
          position: dto.position,
          courseId: dto.courseId,
        },
      },
    });
    if (existing) throw new ConflictException('该岗位已关联此课程');

    return this.prisma.positionCourse.create({
      data: {
        position: dto.position,
        courseId: dto.courseId,
        isRequired: dto.isRequired ?? true,
        validMonths: dto.validMonths ?? 0,
      },
      include: { course: { select: { id: true, name: true } } },
    });
  }

  async remove(id: number) {
    const item = await this.prisma.positionCourse.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('映射不存在');

    await this.prisma.positionCourse.delete({ where: { id } });
    return { message: '已删除' };
  }

  async batchSet(dto: BatchSetPositionCoursesDto) {
    // 批量设置：先删后加
    await this.prisma.positionCourse.deleteMany({
      where: { position: dto.position },
    });

    const data = dto.courseIds.map((courseId) => ({
      position: dto.position,
      courseId,
    }));

    if (data.length > 0) {
      await this.prisma.positionCourse.createMany({ data });
    }

    return { message: `已为岗位"${dto.position}"设置 ${data.length} 门课程` };
  }
}
