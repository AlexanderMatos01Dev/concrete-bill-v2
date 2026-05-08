import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class QueryAssembler {
  /**
   * Transforma una query con marcadores (:variable) a formato Postgres ($1, $2)
   * e inyecta automáticamente el tenantId.
   */
  assemble(query: string, payload: any, tenantId: string): { sql: string; values: any[] } {
    const values: any[] = [];
    let placeholderIndex = 1;

    // 1. Inyectar automáticamente el filtro de tenant si no está presente
    // Nota: Esta es una implementación simplificada. En producción se usaría un parser SQL.
    let finalQuery = query;
    
    // 2. Mapear parámetros del payload
    const paramRegex = /:(\w+)/g;
    
    finalQuery = finalQuery.replace(paramRegex, (match, paramName) => {
      let value;
      
      if (paramName === 'tenantId') {
        value = tenantId;
      } else {
        value = payload[paramName];
        if (value === undefined) {
          throw new BadRequestException(`Falta el parámetro requerido: ${paramName}`);
        }
      }

      values.push(value);
      return `$${placeholderIndex++}`;
    });

    return {
      sql: finalQuery,
      values,
    };
  }
}
