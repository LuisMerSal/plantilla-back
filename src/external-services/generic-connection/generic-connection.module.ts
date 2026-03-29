import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GenericConnectionService } from './generic-connection.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [GenericConnectionService],
  exports: [GenericConnectionService],
})
export class GenericConnectionModule {}
