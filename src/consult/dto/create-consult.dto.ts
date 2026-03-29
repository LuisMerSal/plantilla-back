import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultDto {
  @ApiProperty({
    description: 'Identity number for the consultation',
    example: '0926000532',
  })
  @IsString()
  @IsNotEmpty()
  identityNumber: string;

  @ApiProperty({
    description:
      'Registration number (auto-generated based on identity number)',
    example: '0926000532001',
    required: false,
  })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiProperty({
    description: 'Whether the consultation is forced',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isForced?: boolean;

  @ApiProperty({
    description: 'Origin system of the consultation',
    example: 'SistemaInterno360',
    required: false,
  })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiProperty({
    description: 'Whether this is a production environment consultation',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isProduction?: boolean;
}
