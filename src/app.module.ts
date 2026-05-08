import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CoreModule } from './core/core.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [DatabaseModule, CoreModule, ApiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
