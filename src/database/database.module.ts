import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { TransactionManager } from './transaction.manager';

// TODO: Definir la interfaz Database basada en el esquema de la BD
export interface Database {
  [key: string]: any; 
}

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        const dialect = new PostgresDialect({
          pool: new Pool({
            connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/concretbill',
            max: 10,
          }),
        });

        return new Kysely<Database>({
          dialect,
        });
      },
    },
    TransactionManager,
  ],
  exports: ['DATABASE_CONNECTION', TransactionManager],
})
export class DatabaseModule {}
