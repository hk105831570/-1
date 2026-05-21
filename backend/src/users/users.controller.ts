import {
  Controller, Get, Post, Patch, Param, Body, Query, UploadedFile, UseInterceptors, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@ApiTags('员工管理')
@Controller('admin/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取员工列表' })
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取员工详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '新增员工' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑员工' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '停用员工' })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivate(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '启用员工' })
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.activate(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置员工密码（恢复为身份证后六位）' })
  async resetPassword(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.resetPassword(id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Excel 批量导入员工' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async batchImport(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.batchImport(file);
  }

  @Get(':id/position-history')
  @ApiOperation({ summary: '获取员工岗位变动历史' })
  async getPositionHistory(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPositionHistory(id);
  }
}
