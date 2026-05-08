import { z } from 'zod';
import { ConcretBillModule } from '../../shared/interfaces/concretbill-module.interface';

export const module: ConcretBillModule = {
  subject: 'clientes.crear',
  
  rbacSettings: {
    allowedRoles: ['admin'], // Solo admins pueden crear clientes
  },
  
  payloadSchema: z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Email inválido'),
  }).strict(),
  
  sqlExecution: {
    type: 'mutation',
    query: `
      INSERT INTO clients (name, email, tenant_id) 
      VALUES (:name, :email, :tenantId) 
      RETURNING id, name, email
    `,
  },
  
  outputTransformer: (rows) => {
    return rows[0]; // Retornamos el cliente recién creado
  },

  postHook: async (result, context) => {
    console.log(`[LOG ASÍNCRONO] Cliente creado con éxito: ${result.id} para el tenant ${context.tenantId}`);
    // Aquí se podría disparar un email o una integración externa
  }
};
