import { z } from 'zod';

export interface ConcretBillErrorContext {
  error: any;
  payload: any;
  tenantId: string;
}

export interface ConcretBillModule<TInput = any, TOutput = any> {
  // 1. Identificador único del subject (ej: 'clientes.crear')
  subject: string;
  
  // 2. Seguridad (RBAC)
  rbacSettings: {
    allowedRoles: string[];
  };
  
  // 3. Esquema de Validación de entrada (Zod)
  payloadSchema: z.ZodType<TInput>;
  
  // 4. Instrucción SQL
  sqlExecution: {
    type: 'query' | 'mutation';
    query: string; // Plantilla SQL con marcadores
  };
  
  // 5. Transformador de salida
  outputTransformer: (rawSqlResult: any[]) => TOutput;

  // 6. Manejador de errores personalizado
  errorHandler?: (context: ConcretBillErrorContext) => never;
  
  // 7. Lógica post-ejecución
  postHook?: (result: TOutput, context: any) => Promise<void>;
}
