import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class StartCallDto {
  @ApiPropertyOptional({
    example: '+918688664337',
    description:
      'Phone number to call. Defaults to +918688664337',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Override Vapi assistant ID',
  })
  @IsOptional()
  @IsString()
  assistantId?: string;
}

export class CallQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Search by phone number or other call information',
    example: '8688664337',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'COMPLETED',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by temperature',
    example: 'HOT',
  })
  @IsOptional()
  @IsString()
  temperature?: string;

  @ApiPropertyOptional({
    description: 'Filter by phone number',
    example: '+918688664337',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO)',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO)',
    example: '2026-08-25T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}