import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProgressDto } from './dto/progress.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { QueryStudyRecordDto } from './dto/query-study-record.dto';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取员工的学习课程列表（按岗位派课）
   */
  async getMyCourses(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'active' },
    });
    if (!user) throw new NotFoundException('员工不存在');

    // 查询该岗位对应的课程
    const positionCourses = await this.prisma.positionCourse.findMany({
      where: { position: user.position || '' },
      include: {
        course: {
          select: {
            id: true, name: true, category: true, videoUrl: true,
            videoDuration: true, passingScore: true, version: true,
          },
        },
      },
    });

    // 查询该员工已有的学习记录
    const studyRecords = await this.prisma.studyRecord.findMany({
      where: { userId },
    });

    const recordMap = new Map(studyRecords.map((r) => [r.courseId, r]));

    // 查询考试记录（最近一次）
    const examRecords = await this.prisma.examRecord.findMany({
      where: { userId },
      orderBy: { examTime: 'desc' },
    });
    const examMap = new Map<number, any>();
    for (const exam of examRecords) {
      if (!examMap.has(exam.courseId)) {
        examMap.set(exam.courseId, exam);
      }
    }

    const courses = positionCourses.map((pc) => {
      const record = recordMap.get(pc.courseId);
      const exam = examMap.get(pc.courseId);
      const status = record?.isCompleted
        ? 'completed'
        : record
          ? 'learning'
          : 'not_started';

      return {
        courseId: pc.courseId,
        courseName: pc.course.name,
        category: pc.course.category,
        videoUrl: pc.course.videoUrl,
        videoDuration: pc.course.videoDuration,
        passingScore: pc.course.passingScore,
        courseVersion: pc.course.version,
        isRequired: pc.isRequired,
        validMonths: pc.validMonths,
        status,
        progress: record?.currentProgress || 0,
        totalDuration: record?.totalDuration || 0,
        lastViewTime: record?.lastViewTime || null,
        completedAt: record?.completedAt || null,
        examScore: exam ? { score: exam.score, isPassed: exam.isPassed, attemptNumber: exam.attemptNumber } : null,
      };
    });

    return courses;
  }

  /**
   * 更新视频观看进度（增量更新）
   */
  async updateProgress(userId: number, dto: UpdateProgressDto) {
    const { courseId, increment, currentProgress, videoDuration } = dto;

    // 检查课程是否存在
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null, isActive: true },
    });
    if (!course) throw new NotFoundException('课程不存在');

    // 如果前端传入了实际视频时长且与存储值不同，更新课程记录
    let effectiveDuration = course.videoDuration;
    if (videoDuration && videoDuration > 0 && videoDuration !== course.videoDuration) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { videoDuration },
      });
      effectiveDuration = videoDuration;
    }

    // 确保进度不超过视频时长
    const cappedProgress = effectiveDuration
      ? Math.min(currentProgress, effectiveDuration)
      : currentProgress;

    // upsert 学习记录：有则更新，无则创建
    const record = await this.prisma.studyRecord.upsert({
      where: {
        uk_user_course: { userId, courseId },
      },
      create: {
        userId,
        courseId,
        courseVersion: course.version,
        totalDuration: increment,
        currentProgress: cappedProgress,
        lastViewTime: new Date(),
      },
      update: {
        totalDuration: { increment },
        currentProgress: cappedProgress,
        lastViewTime: new Date(),
      },
    });

    // 判断是否完成（进度 >= 视频时长）
    const isComplete = effectiveDuration && cappedProgress >= effectiveDuration;
    if (isComplete && !record.isCompleted) {
      await this.prisma.studyRecord.update({
        where: { id: record.id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    return { message: '进度更新成功', progress: cappedProgress };
  }

  /**
   * 获取某门课的考试题目
   */
  async getExamQuestions(courseId: number, userId: number) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });
    if (!course) throw new NotFoundException('课程不存在');

    // 检查学习记录，视频必须完成才能考试
    const record = await this.prisma.studyRecord.findUnique({
      where: { uk_user_course: { userId, courseId } },
    });
    if (!record?.isCompleted) {
      throw new ForbiddenException('请先完成视频学习再参加考试');
    }

    const questions = await this.prisma.examQuestion.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        questionType: true,
        title: true,
        options: true,
        score: true,
        sortOrder: true,
        // 注意：不返回正确答案，防止作弊
      },
    });

    return questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));
  }

  /**
   * 提交考试 + 自动判分
   */
  async submitExam(userId: number, dto: SubmitExamDto) {
    const { courseId, answers } = dto;

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });
    if (!course) throw new NotFoundException('课程不存在');

    // 获取考试的所有题目（含答案，用于判分）
    const questions = await this.prisma.examQuestion.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
    });

    if (questions.length === 0) {
      throw new BadRequestException('该课程暂无题目');
    }

    // 逐题判分
    let totalScore = 0;
    const answerDetails: any[] = [];

    for (const question of questions) {
      const userAnswer = answers.find((a) => a.questionId === question.id)?.answer || '';
      let isCorrect = false;
      let earnedScore = 0;

      if (question.questionType === 'single' || question.questionType === 'judge') {
        // 单选/判断：完全匹配
        isCorrect = userAnswer.toUpperCase() === question.answer.toUpperCase();
      } else if (question.questionType === 'multiple') {
        // 多选：完全正确得满分，少选得一半分
        const correctSet = new Set(question.answer.split(',').map((s) => s.trim().toUpperCase()));
        const userSet = new Set(userAnswer.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean));

        if (userSet.size === 0) {
          isCorrect = false;
        } else if (userSet.size === correctSet.size && [...userSet].every((a) => correctSet.has(a))) {
          // 完全匹配
          isCorrect = true;
        } else if ([...userSet].every((a) => correctSet.has(a))) {
          // 少选（没有错选），得一半分
          earnedScore = Math.floor(question.score / 2);
        }
        // 有错选得0分
      }

      if (isCorrect) {
        earnedScore = question.score;
      }

      totalScore += earnedScore;

      answerDetails.push({
        questionId: question.id,
        questionType: question.questionType,
        title: question.title,
        correctAnswer: question.answer,
        userAnswer,
        score: question.score,
        earnedScore,
        isCorrect,
      });
    }

    // 统计第几次考试
    const examCount = await this.prisma.examRecord.count({
      where: { userId, courseId },
    });

    const isPassed = totalScore >= course.passingScore;

    const examRecord = await this.prisma.examRecord.create({
      data: {
        userId,
        courseId,
        courseVersion: course.version,
        score: totalScore,
        isPassed,
        answerDetail: JSON.stringify(answerDetails),
        attemptNumber: examCount + 1,
      },
    });

    await this.prisma.operationLog.create({
      data: {
        operatorId: userId,
        operatorType: 'employee',
        actionType: 'SUBMIT_EXAM',
        target: `课程:${courseId}`,
        detail: `考试结果: ${isPassed ? '通过' : '未通过'}，得分: ${totalScore}`,
      },
    });

    return {
      examRecordId: examRecord.id,
      score: totalScore,
      passingScore: course.passingScore,
      isPassed,
      totalQuestions: questions.length,
      attemptNumber: examCount + 1,
      answerDetails,
    };
  }

  /**
   * 获取员工的学习记录
   */
  async getMyRecords(userId: number) {
    const records = await this.prisma.studyRecord.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, name: true, category: true, passingScore: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // 同时查询考试记录
    const examRecords = await this.prisma.examRecord.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, name: true },
        },
      },
      orderBy: { examTime: 'desc' },
    });

    // 将考试记录按课程分组
    const examMap = new Map<number, any[]>();
    for (const exam of examRecords) {
      if (!examMap.has(exam.courseId)) examMap.set(exam.courseId, []);
      examMap.get(exam.courseId)!.push(exam);
    }

    return records.map((r) => ({
      courseId: r.courseId,
      courseName: r.course.name,
      category: r.course.category,
      startTime: r.startTime,
      lastViewTime: r.lastViewTime,
      totalDuration: r.totalDuration,
      currentProgress: r.currentProgress,
      isCompleted: r.isCompleted,
      completedAt: r.completedAt,
      passingScore: r.course.passingScore,
      exams: (examMap.get(r.courseId) || []).map((e) => ({
        examTime: e.examTime,
        score: e.score,
        isPassed: e.isPassed,
        attemptNumber: e.attemptNumber,
      })),
    }));
  }

  /**
   * 管理员查询所有员工的学习记录
   */
  async getAllStudyRecords(query: QueryStudyRecordDto) {
    const { keyword, department, courseId, isCompleted, dateFrom, dateTo, page = 1, pageSize = 20 } = query;

    const where: any = {};

    // 按用户信息搜索
    if (keyword || department) {
      where.user = {};
      if (keyword) {
        where.user.OR = [
          { name: { contains: keyword } },
          { employeeId: { contains: keyword } },
        ];
      }
      if (department) {
        where.user.department = department;
      }
      where.user.deletedAt = null;
    }

    // 按课程筛选
    if (courseId) where.courseId = courseId;

    // 按完成状态
    if (isCompleted !== undefined) where.isCompleted = isCompleted;

    // 按日期范围
    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = new Date(dateFrom);
      if (dateTo) where.completedAt.lte = new Date(dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.studyRecord.findMany({
        where,
        include: {
          user: { select: { id: true, employeeId: true, name: true, department: true, position: true } },
          course: { select: { id: true, name: true, category: true, passingScore: true, videoDuration: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.studyRecord.count({ where }),
    ]);

    // 查询相关考试记录
    const userIds = items.map((r) => r.userId);
    const courseIds = items.map((r) => r.courseId);
    const examRecords = userIds.length > 0
      ? await this.prisma.examRecord.findMany({
          where: { userId: { in: userIds }, courseId: { in: courseIds } },
          orderBy: { examTime: 'desc' },
        })
      : [];

    // 按 (userId, courseId) 分组取最近一次
    const examMap = new Map<string, any>();
    for (const exam of examRecords) {
      const key = `${exam.userId}-${exam.courseId}`;
      if (!examMap.has(key)) {
        examMap.set(key, exam);
      }
    }

    // 获取所有不重复的部门列表
    const departments = await this.prisma.user.findMany({
      where: { deletedAt: null, department: { not: null }, NOT: { department: '' } },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    });

    return {
      items: items.map((r) => {
        const exam = examMap.get(`${r.userId}-${r.courseId}`);
        return {
          id: r.id,
          userId: r.userId,
          employeeId: r.user.employeeId,
          employeeName: r.user.name,
          department: r.user.department,
          position: r.user.position,
          courseId: r.courseId,
          courseName: r.course.name,
          courseCategory: r.course.category,
          passingScore: r.course.passingScore,
          videoDuration: r.course.videoDuration,
          currentProgress: r.currentProgress,
          totalDuration: r.totalDuration,
          isCompleted: r.isCompleted,
          completedAt: r.completedAt,
          lastViewTime: r.lastViewTime,
          startTime: r.startTime,
          exam: exam
            ? {
                score: exam.score,
                isPassed: exam.isPassed,
                attemptNumber: exam.attemptNumber,
                examTime: exam.examTime,
              }
            : null,
        };
      }),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      departments: departments.map((d) => d.department),
    };
  }
}
