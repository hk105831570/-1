import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { Prisma } from '@prisma/client';
import { join } from 'path';
import { existsSync, unlinkSync, rmSync } from 'fs';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCourseDto) {
    const { page = 1, pageSize = 20, keyword, isActive, sortBy, sortOrder } = query;

    const where: Prisma.CourseWhereInput = { deletedAt: null };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { category: { contains: keyword } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === true;

    const orderBy: Prisma.CourseOrderByWithRelationInput = {};
    if (sortBy && ['name', 'version', 'createdAt', 'updatedAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null },
    });
    if (!course) throw new NotFoundException('课程不存在');
    return course;
  }

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        name: dto.name,
        category: dto.category,
        videoUrl: dto.videoUrl,
        videoDuration: dto.videoDuration,
        passingScore: dto.passingScore ?? 80,
        docUrl: dto.docUrl,
      },
    });
  }

  async update(id: number, dto: UpdateCourseDto) {
    const course = await this.findOne(id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.passingScore !== undefined) updateData.passingScore = dto.passingScore;
    if (dto.docUrl !== undefined) updateData.docUrl = dto.docUrl;

    // 视频更新时版本号 +1，并删除旧视频文件
    if (dto.videoUrl !== undefined) {
      // 删除旧视频文件
      if (course.videoUrl) {
        deleteVideoFile(course.videoUrl);
      }
      updateData.videoUrl = dto.videoUrl;
      updateData.version = { increment: 1 };
    }

    // 视频时长可独立更新
    if (dto.videoDuration !== undefined) {
      updateData.videoDuration = dto.videoDuration;
    }

    // 没有视频但其他内容更新，也加版本号
    if (dto.videoUrl === undefined && Object.keys(updateData).length > 0) {
      updateData.version = { increment: 1 };
    }

    return this.prisma.course.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleActive(id: number) {
    const course = await this.findOne(id);
    return this.prisma.course.update({
      where: { id },
      data: { isActive: !course.isActive },
    });
  }

  async remove(id: number) {
    const course = await this.findOne(id);

    // 删除视频文件
    if (course.videoUrl) {
      deleteVideoFile(course.videoUrl);
    }

    // 删除课程视频文件夹（如有遗留文件）
    const courseVideoDir = join(process.cwd(), 'uploads/videos', `course_${id}`);
    if (existsSync(courseVideoDir)) {
      rmSync(courseVideoDir, { recursive: true, force: true });
    }

    // 软删除课程
    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

/**
 * 根据 videoUrl 删除对应的视频文件
 */
function deleteVideoFile(videoUrl: string) {
  try {
    // videoUrl 格式如 /uploads/videos/xxx.mp4 或 /uploads/videos/course_N/xxx.mp4
    const relativePath = videoUrl.replace(/^\/uploads\//, '');
    const fullPath = join(process.cwd(), 'uploads', relativePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
      console.log(`已删除视频文件: ${fullPath}`);
    }
  } catch (err) {
    console.error(`删除视频文件失败: ${videoUrl}`, err);
  }
}
