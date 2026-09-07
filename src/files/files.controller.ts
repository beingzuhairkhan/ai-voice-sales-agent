import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get configured file URLs (resume, architecture image, developer contact)' })
  getFileConfig() {
    return this.filesService.getFileConfig();
  }
}
