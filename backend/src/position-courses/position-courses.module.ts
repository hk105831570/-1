import { Module } from '@nestjs/common';
import { PositionCoursesController } from './position-courses.controller';
import { PositionCoursesService } from './position-courses.service';

@Module({
  controllers: [PositionCoursesController],
  providers: [PositionCoursesService],
  exports: [PositionCoursesService],
})
export class PositionCoursesModule {}
