import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardTotals() {
    try {
      // Total de consultas activas
      const totalConsults = await this.prisma.databookConsult.count({
        where: {
          isActive: true,
        },
      });

      // Total de usuarios
      const totalUsers = await this.prisma.user.count({
        where: {
          isActive: true,
        },
      });

      // Consultas por sexo
      const consultsBySex = await this.prisma.databookConsult.groupBy({
        by: ['sexo'],
        where: {
          isActive: true,
        },
        _count: {
          sexo: true,
        },
      });

      // Consultas por estado civil
      const consultsByCivilStatus = await this.prisma.databookConsult.groupBy({
        by: ['civilStatus'],
        where: {
          isActive: true,
        },
        _count: {
          civilStatus: true,
        },
      });

      // Suma total de cupos asignados
      const totalCupo = await this.prisma.databookConsult.aggregate({
        where: {
          isActive: true,
        },
        _sum: {
          cupo: true,
        },
      });

      // Suma total de cuotas
      const totalCuota = await this.prisma.databookConsult.aggregate({
        where: {
          isActive: true,
        },
        _sum: {
          cuota: true,
        },
      });

      // Promedio de edad
      const averageAge = await this.prisma.databookConsult.aggregate({
        where: {
          isActive: true,
        },
        _avg: {
          edad: true,
        },
      });

      // Consultas creadas en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentConsults = await this.prisma.databookConsult.count({
        where: {
          isActive: true,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Top 10 empresas con más empleados consultados
      const topCompanies = await this.prisma.databookConsult.groupBy({
        by: ['dependenceName'],
        where: {
          isActive: true,
          dependenceName: {
            not: 'NO-DATA',
          },
        },
        _count: {
          dependenceName: true,
        },
        orderBy: {
          _count: {
            dependenceName: 'desc',
          },
        },
        take: 10,
      });

      // Distribución por rango de edad
      const allConsults = await this.prisma.databookConsult.findMany({
        where: {
          isActive: true,
        },
        select: {
          edad: true,
        },
      });

      const ageRanges = {
        '18-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46-55': 0,
        '56-65': 0,
        '66+': 0,
      };

      allConsults.forEach((consult) => {
        const age = consult.edad || 0;
        if (age >= 18 && age <= 25) ageRanges['18-25']++;
        else if (age >= 26 && age <= 35) ageRanges['26-35']++;
        else if (age >= 36 && age <= 45) ageRanges['36-45']++;
        else if (age >= 46 && age <= 55) ageRanges['46-55']++;
        else if (age >= 56 && age <= 65) ageRanges['56-65']++;
        else if (age >= 66) ageRanges['66+']++;
      });

      // Total de transacciones
      const totalTransactions = await this.prisma.transaction.count();

      const transactionsByStatus = await this.prisma.transaction.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      // Calcular costo total de consultas (cada consulta cuesta $0.20)
      const CONSULT_COST = 0.2;
      const totalConsultCost = totalConsults * CONSULT_COST;

      return {
        message: 'Dashboard totals retrieved successfully',
        data: {
          totals: {
            consults: totalConsults,
            users: totalUsers,
            transactions: totalTransactions,
            recentConsults: recentConsults,
            totalConsultCost: totalConsultCost,
          },
          financial: {
            totalCupo: totalCupo._sum.cupo || 0,
            totalCuota: totalCuota._sum.cuota || 0,
            averageCupo:
              totalConsults > 0
                ? (totalCupo._sum.cupo || 0) / totalConsults
                : 0,
          },
          demographics: {
            averageAge: averageAge._avg.edad || 0,
            bySex: consultsBySex.map((item) => ({
              sex: item.sexo,
              count: item._count.sexo,
            })),
            byCivilStatus: consultsByCivilStatus.map((item) => ({
              status: item.civilStatus,
              count: item._count.civilStatus,
            })),
            byAgeRange: ageRanges,
          },
          employment: {
            topCompanies: topCompanies.map((item) => ({
              company: item.dependenceName,
              count: item._count.dependenceName,
            })),
          },
          transactions: {
            byStatus: transactionsByStatus.map((item) => ({
              status: item.status,
              count: item._count.status,
            })),
          },
        },
      };
    } catch (error) {
      console.error('Dashboard error:', error);
      throw error;
    }
  }

  async getConsultsByDateRange(startDate: Date, endDate: Date) {
    try {
      const consults = await this.prisma.databookConsult.count({
        where: {
          isActive: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return {
        message: 'Consults by date range retrieved successfully',
        data: {
          count: consults,
          startDate,
          endDate,
        },
      };
    } catch (error) {
      console.error('Date range query error:', error);
      throw error;
    }
  }

  async getMonthlyStats() {
    try {
      const currentYear = new Date().getFullYear();
      const monthlyData: Array<{
        month: number;
        monthName: string;
        count: number;
      }> = [];

      for (let month = 0; month < 12; month++) {
        const startDate = new Date(currentYear, month, 1);
        const endDate = new Date(currentYear, month + 1, 0);

        const count = await this.prisma.databookConsult.count({
          where: {
            isActive: true,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        monthlyData.push({
          month: month + 1,
          monthName: startDate.toLocaleString('es-ES', { month: 'long' }),
          count,
        });
      }

      return {
        message: 'Monthly statistics retrieved successfully',
        data: {
          year: currentYear,
          months: monthlyData,
        },
      };
    } catch (error) {
      console.error('Monthly stats error:', error);
      throw error;
    }
  }
}
