import { Module } from '@nestjs/common';
import { DispatcherController } from './controllers/dispatcher.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [DispatcherController],
  providers: [],
})
export class ApiModule {}
