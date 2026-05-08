import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction } from 'kysely';
import { Database } from './database.module';

@Injectable()
export class TransactionManager {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Kysely<Database>,
  ) {}

  /**
   * Ejecuta una función dentro de una transacción de base de datos.
   * Si la función lanza una excepción, la transacción se revierte automáticamente.
   */
  async run<T>(
    callback: (trx: Transaction<Database>) => Promise<T>,
  ): Promise<T> {
    return await this.db.transaction().execute(async (trx) => {
      return await callback(trx);
    });
  }

  /**
   * Obtiene la instancia de base de datos (fuera de transacción o maestra).
   */
  get client(): Kysely<Database> {
    return this.db;
  }
}
