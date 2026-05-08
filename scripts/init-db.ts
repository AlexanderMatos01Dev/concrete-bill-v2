import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function init() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/concretbill',
  });

  try {
    await client.connect();
    console.log('📦 Conectado a Postgres para inicialización...');

    const sqlPath = path.join(__dirname, '../src/database/migrations/1_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('✅ Esquema inicial creado con éxito.');

    // Crear un Tenant de prueba para que puedas usarlo en tus peticiones
    const tenantId = '123e4567-e89b-12d3-a456-426614174000';
    await client.query(`
      INSERT INTO tenants (id, name, slug) 
      VALUES ('${tenantId}', 'Empresa Demo MVP', 'demo-mvp')
      ON CONFLICT DO NOTHING;
    `);
    console.log(`🚀 Tenant de prueba creado. ID: ${tenantId}`);

  } catch (err) {
    console.error('❌ Error inicializando la BD:', err.message);
  } finally {
    await client.end();
  }
}

init();
