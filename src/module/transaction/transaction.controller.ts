import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('/')
  getTransactions() {
    return this.transactionService.getTransactions();
  }

  @Get(':id/status')
  getTransactionStatus(@Param('id') id: string) {
    return this.transactionService.getTransactionStatus(id);
  }
}
