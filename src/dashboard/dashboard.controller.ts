import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleType } from '../common/enums/user-role.enum';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('totals')
  //@UseGuards(RolesGuard)
  //@Roles(UserRoleType.ADMIN, UserRoleType.USER)
  @ApiOperation({ summary: 'Get dashboard totals and statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard totals retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Dashboard totals retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            totals: {
              type: 'object',
              properties: {
                consults: { type: 'number', example: 8540 },
                users: { type: 'number', example: 25 },
                transactions: { type: 'number', example: 150 },
                recentConsults: { type: 'number', example: 234 },
                totalConsultCost: { type: 'number', example: 1708.0 },
              },
            },
            financial: {
              type: 'object',
              properties: {
                totalCupo: { type: 'number', example: 2500000.5 },
                totalCuota: { type: 'number', example: 1800000.0 },
                averageCupo: { type: 'number', example: 292.72 },
              },
            },
            demographics: {
              type: 'object',
              properties: {
                averageAge: { type: 'number', example: 42.5 },
                bySex: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      sex: { type: 'string', example: 'MASCULINO' },
                      count: { type: 'number', example: 4523 },
                    },
                  },
                },
                byCivilStatus: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'CASADO' },
                      count: { type: 'number', example: 3200 },
                    },
                  },
                },
                byAgeRange: {
                  type: 'object',
                  example: {
                    '18-25': 850,
                    '26-35': 2100,
                    '36-45': 2800,
                    '46-55': 1900,
                    '56-65': 700,
                    '66+': 190,
                  },
                },
              },
            },
            employment: {
              type: 'object',
              properties: {
                topCompanies: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      company: { type: 'string', example: 'EMPRESA XYZ' },
                      count: { type: 'number', example: 125 },
                    },
                  },
                },
              },
            },
            transactions: {
              type: 'object',
              properties: {
                byStatus: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'completed' },
                      count: { type: 'number', example: 120 },
                    },
                  },
                },
              },
            },
          },
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
    description: 'Forbidden. Insufficient permissions.',
  })
  getDashboardTotals() {
    return this.dashboardService.getDashboardTotals();
  }

  @Get('date-range')
  //@UseGuards(RolesGuard)
  //@Roles(UserRoleType.ADMIN, UserRoleType.USER)
  @ApiOperation({ summary: 'Get consults by date range' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO format (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO format (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consults by date range retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date format.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  getConsultsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.dashboardService.getConsultsByDateRange(start, end);
  }

  @Get('monthly-stats')
  //@UseGuards(RolesGuard)
  //@Roles(UserRoleType.ADMIN, UserRoleType.USER)
  @ApiOperation({ summary: 'Get monthly statistics for current year' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly statistics retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Monthly statistics retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            year: { type: 'number', example: 2026 },
            months: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'number', example: 1 },
                  monthName: { type: 'string', example: 'enero' },
                  count: { type: 'number', example: 450 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  getMonthlyStats() {
    return this.dashboardService.getMonthlyStats();
  }
}
