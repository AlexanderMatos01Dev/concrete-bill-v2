import { z } from 'zod';
import { ConcretBillModule } from '../../shared/interfaces/concretbill-module.interface';

export const module: ConcretBillModule = {
  subject: 'clientes.listar',
  
  rbacSettings: {
    allowedRoles: ['admin', 'user'], // Permite a usuarios y admins
  },
  
  payloadSchema: z.object({
    // Podríamos añadir filtros de búsqueda aquí
  }).strict(),
  
  sqlExecution: {
    type: 'query',
    query: `
      SELECT id, name, email, created_at 
      FROM clients 
      WHERE tenant_id = :tenantId
      ORDER BY created_at DESC
    `,
  },
  
  outputTransformer: (rows) => {
    return {
      count: rows.length,
      data: rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        date: row.created_at
      }))
    };
  }
};
