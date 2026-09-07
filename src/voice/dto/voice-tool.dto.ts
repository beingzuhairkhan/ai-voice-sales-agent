import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsArray as IsArr } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadDto {
  @ApiProperty() @IsString() callId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() productCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() budget?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timeline?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) requiredFeatures?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) painPoints?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDecisionMaker?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) barriers?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) objections?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) buyingSignals?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
}

export class SendWhatsappDto {
  @ApiProperty() @IsString() callId!: string;
  @ApiProperty() @IsString() messageContent!: string;
}

export class BookCallbackDto {
  @ApiProperty() @IsString() callId!: string;
  @ApiProperty() @IsString() requestedTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class GetLeadContextDto {
  @ApiProperty() @IsString() callId!: string;
}

export class EndCallDto {
  @ApiProperty() @IsString() callId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
}
