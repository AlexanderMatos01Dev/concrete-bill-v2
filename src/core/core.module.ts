import { Global, Module } from '@nestjs/common';
import { RegistryService } from './registry/registry.service';
import { ExecutionService } from './executor/execution.service';
import { QueryAssembler } from './executor/query-assembler';

@Global()
@Module({
  providers: [
    RegistryService,
    ExecutionService,
    QueryAssembler,
  ],
  exports: [
    RegistryService,
    ExecutionService,
    QueryAssembler,
  ],
})
export class CoreModule {}
