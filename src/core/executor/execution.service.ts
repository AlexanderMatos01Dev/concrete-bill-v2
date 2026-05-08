import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { RegistryService } from '../registry/registry.service';
import { QueryAssembler } from './query-assembler';
import { TransactionManager } from '../../database/transaction.manager';
import { ConcretBillModule } from '../../shared/interfaces/concretbill-module.interface';
import { CompiledQuery } from 'kysely';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly registry: RegistryService,
    private readonly queryAssembler: QueryAssembler,
    private readonly txManager: TransactionManager,
  ) {}

  async execute(subject: string, payload: any, tenantId: string): Promise<any> {
    const module = this.registry.getModule(subject);
    
    if (!module) {
      throw new NotFoundException(`Subject [${subject}] no encontrado en el Registry.`);
    }

    // 1. Validación de Esquema (Fail-fast)
    this.validatePayload(module, payload);

    try {
      // 2. Orquestación de ejecución transaccional
      return await this.txManager.run(async (trx) => {
        // 3. Ensamblado de Query
        const { sql: sqlText, values } = this.queryAssembler.assemble(
          module.sqlExecution.query,
          payload,
          tenantId,
        );

        // 4. Ejecución SQL pura parametrizada usando CompiledQuery
        const rawResult = await trx.executeQuery(
          CompiledQuery.raw(sqlText, values),
        );
        const rows = rawResult.rows as any[];

        // 5. Transformación de salida
        const transformedResult = module.outputTransformer(rows);

        // 6. Post-Hook (Asíncrono, no bloquea la respuesta principal si se desea)
        if (module.postHook) {
          module.postHook(transformedResult, { payload, tenantId }).catch(err => {
            console.error(`Error en Post-Hook de ${subject}:`, err);
          });
        }

        return transformedResult;
      });
    } catch (error) {
      this.handleError(module, error, payload, tenantId);
    }
  }

  private validatePayload(module: ConcretBillModule, payload: any) {
    const result = module.payloadSchema.safeParse(payload);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Error de validación de esquema',
        errors: result.error.format(),
      });
    }
  }

  private handleError(module: ConcretBillModule, error: any, payload: any, tenantId: string): never {
    if (module.errorHandler) {
      module.errorHandler({ error, payload, tenantId });
    }

    // Manejo de errores genérico de base de datos
    if (error.code === '23505') {
      throw new BadRequestException('Conflicto: El registro ya existe (Llave duplicada).');
    }

    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }

    console.error('Core Execution Error:', error);
    throw new InternalServerErrorException('Error interno en la ejecución del subject.');
  }
}
