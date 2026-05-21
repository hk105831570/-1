import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.avi', '.mov', '.mkv'];

function getVideoDuration(filePath: string): number | null {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { timeout: 10000, encoding: 'utf8' },
    );
    const seconds = parseFloat(result.trim());
    return isNaN(seconds) ? null : Math.round(seconds);
  } catch {
    return null;
  }
}

@ApiTags('文件上传')
@Controller('admin/upload')
export class UploadController {
  @Post('video')
  @ApiOperation({ summary: '上传视频文件' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'courseId', required: false, type: Number, description: '课程ID，传了则存入对应文件夹' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          let uploadDir = join(process.cwd(), 'uploads/videos');
          // 如果传了 courseId，存入课程子文件夹
          const courseId = (_req.query as any).courseId;
          if (courseId) {
            uploadDir = join(uploadDir, `course_${courseId}`);
          }
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!VIDEO_EXTENSIONS.includes(ext)) {
          return cb(new BadRequestException('不支持的文件格式，请上传视频文件'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File, @Query('courseId') courseId?: string) {
    if (!file) throw new BadRequestException('请选择文件');

    // 自动检测视频时长（秒）
    const duration = getVideoDuration(file.path);

    const folder = courseId ? `/uploads/videos/course_${courseId}` : '/uploads/videos';

    return {
      url: `${folder}/${file.filename}`,
      filename: file.filename,
      size: file.size,
      duration,
    };
  }
}
