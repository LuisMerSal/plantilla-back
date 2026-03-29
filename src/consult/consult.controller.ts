import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { ConsultService } from './consult.service';
import { CreateConsultDto } from './dto/create-consult.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleType } from '../common/enums/user-role.enum';

@ApiTags('consult')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consult')
export class ConsultController {
  constructor(private readonly consultService: ConsultService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new consultation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The consultation has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  create(
    @Body() createConsultDto: CreateConsultDto,
    @Request() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.consultService.create(createConsultDto, req.user.sub);
  }

  @Post('massive')
  createMassive(
    @Body() createConsultDto: any,
    @Request() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.consultService.createMassive(createConsultDto, req.user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  //@Roles(UserRoleType.ADMIN)
  @ApiOperation({
    summary: 'Get all consultations with pagination (Admin only)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by identity number',
    example: '1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of all consultations.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Admin role required.',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.consultService.findAll(paginationDto, paginationDto.search);
  }

  @Get('my-consults')
  @ApiOperation({ summary: 'Get current user consultations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of user consultations.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  getMyConsults(
    @Request() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.consultService.getConsultsByUser(req.user.sub);
  }

  @Get('identity/:identityNumber')
  @ApiOperation({ summary: 'Get consultations by identity number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of consultations for the identity number.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  findByIdentityNumber(@Param('identityNumber') identityNumber: string) {
    return this.consultService.findByIdentityNumber(identityNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consultation by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The consultation record.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consultation not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  findOne(@Param('id') id: string) {
    return this.consultService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Delete consultation (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The consultation has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consultation not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Admin role required.',
  })
  remove(@Param('id') id: string) {
    return this.consultService.remove(id);
  }

  @Get('export/csv')
  @UseGuards(RolesGuard)
  //@Roles(UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Export all consultations to CSV (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV file with all consultations data.',
    headers: {
      'Content-Type': {
        description: 'text/csv',
      },
      'Content-Disposition': {
        description: 'attachment; filename="consults-export.csv"',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Admin role required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to export data.',
  })
  async exportCSV(@Res() res: Response) {
    try {
      const filePath = await this.consultService.exportToCSV();

      // Read the file
      const file = fs.createReadStream(filePath);

      // Set headers for file download
      const filename = filePath.split('/').pop() || 'consults-export.csv';
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });

      // Stream the file
      file.pipe(res);

      // Clean up: Delete file after sending (optional)
      file.on('end', () => {
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to export CSV',
        error: error.message,
      });
    }
  }

  @Post('recalculate')
  @UseGuards(RolesGuard)
  //@Roles(UserRoleType.ADMIN)
  @ApiOperation({
    summary:
      'Recalculate cupo, cuota and shawdonQuota for all consultations (Admin only)',
    description:
      'This endpoint recalculates cupo, cuota and shawdonQuota values for all active consultations using the current factor values. The process is optimized for large datasets using batch processing.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recalculation completed successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Cupos recalculated successfully',
        },
        processedCount: {
          type: 'number',
          example: 8000,
        },
        errorCount: {
          type: 'number',
          example: 0,
        },
        totalRecords: {
          type: 'number',
          example: 8000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Admin role required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to recalculate data.',
  })
  async recalculateData() {
    return this.consultService.recalculateData();
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate PDF report for a consultation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF generated successfully.',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consult not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to generate PDF.',
  })
  async generatePDF(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.consultService.generateConsultPDF(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=consult-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
