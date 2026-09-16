import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check — MongoDB, Redis and provider config (no secrets exposed)' })
  async checkHealth() {
    return this.healthService.checkHealth();
  }
}
