import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions() {
    const transaction = await this.prisma.transaction.findFirst({
      select: {
        id: true,
        type: true,
        status: true,
        message: true,
        successCount: true,
        errorCount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return transaction;
  }

  async getTransactionStatus(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    return transaction;
  }

  async createTransaction(data: {
    type: string;
    status: string;
    message?: string;
    datajson?: any;
  }) {
    return await this.prisma.transaction.create({
      data: {
        type: data.type,
        status: data.status,
        message: data.message,
        datajson: data.datajson || {},
        isActive: true,
      },
    });
  }

  async updateTransactionStatus(
    transactionId: string,
    status: string,
    message?: string,
    datajson?: any,
  ) {
    return await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        message,
        datajson,
      },
    });
  }
}
