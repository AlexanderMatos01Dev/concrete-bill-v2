ConcretBill Framework: Blueprint de Arquitectura

1. Paradigma Arquitectónico

El motor ConcretBill es un framework backend propietario construido sobre NestJS y TypeScript. Se fundamenta en una Arquitectura Basada en Metadatos (Metadata-Driven Architecture) acoplada a un patrón de Controlador Frontal (Dispatcher Gateway).

El objetivo central de ConcretBill es agilizar la creación de módulos de manera exponencial. Al erradicar el patrón tradicional MVC (Modelo-Vista-Controlador), la exposición de un nuevo endpoint se reduce a la definición de sus tablas, los campos de entrada (payload), los campos de salida (outputTransformer), la lógica de negocio mediante consultas SQL y las reglas de validación de usuarios (RBAC). Este diseño determinista hace que el sistema sea altamente interoperable y operable por sistemas de agentes automatizados.

Conceptos Fundamentales

Dispatcher Gateway: Único punto de entrada HTTP (/dispatch). Evita la proliferación de rutas estáticas y centraliza la interceptación.

Multi-tenant Unified Logic: Aislamiento lógico de datos dentro de una base de datos única (PostgreSQL). El sistema garantiza la separación mediante discriminadores de inquilino (tenant_id) inyectados automáticamente en la capa de ejecución.

Generic & System Subjects: Capacidad de definir métodos base y utilitarios (ej. búsquedas de empleados, listados de clientes) que sirven como cimientos para módulos de negocio específicos.

2. Topología de Directorios (Implementación NestJS)

La estructura física refleja las barreras lógicas del sistema, asegurando que las modificaciones de negocio (creación de nuevos módulos de facturación, clientes, etc.) no alteren el motor central.

/concretbill-engine
├── /src
│   ├── /api                    # CAPA 1: EXPOSICIÓN Y SEGURIDAD HTTP
│   │   ├── /controllers
│   │   │   └── dispatcher.controller.ts # Endpoint universal: POST /dispatch
│   │   ├── /guards
│   │   │   ├── jwt-auth.guard.ts        # Validación criptográfica de token
│   │   │   └── rbac.guard.ts            # Autorización basada en roles (Subject)
│   │   ├── /interceptors
│   │   │   └── tenant-context.interceptor.ts # Resolución del ID del Inquilino
│   │   └── api.module.ts
│   │
│   ├── /core                   # CAPA 2: MOTOR CONCRETBILL (El Cerebro)
│   │   ├── /registry
│   │   │   ├── registry.service.ts      # Indexador de módulos y métodos genéricos
│   │   │   ├── registry.manager.ts      # Introspección y documentación de subjects
│   │   │   └── registry.cache.ts        # Mapa en memoria y caché de permisos (Session)
│   │   ├── /validator
│   │   │   └── schema-validator.service.ts # Motor Zod para validación bidireccional
│   │   ├── /executor
│   │   │   ├── query-assembler.ts       # Inyección de parámetros y tenant_id
│   │   │   └── execution.service.ts     # Orquestador: Try/Catch, Transformers, Hooks
│   │   └── core.module.ts               # Módulo Global
│   │
│   ├── /modules                # CAPA 3: DEFINICIONES DECLARATIVAS (Negocio)
│   │   ├── /clientes
│   │   │   ├── clientes.crear.ts        # Implementa ConcretBillModule
│   │   │   └── clientes.listar.ts       
│   │   ├── /facturacion
│   │   │   └── facturas.emitir.ts
│   │   └── index.ts                     # Agregador de Módulos para el Registry
│   │
│   ├── /database               # CAPA 4: PERSISTENCIA (PostgreSQL)
│   │   ├── /migrations                  # Versionado de esquemas SQL (Tablas unificadas)
│   │   ├── database.module.ts           # Proveedor de pool de conexiones (Kysely/Pg)
│   │   └── transaction.manager.ts       # Gestor de Rollback/Commit y Tenant-Filter
│   │
│   ├── /shared                 # CONTRATOS Y HERRAMIENTAS GLOBALES
│   │   ├── /interfaces
│   │   │   ├── concretbill-module.interface.ts # El estándar estricto de negocio
│   │   │   └── dispatch-request.interface.ts
│   │   ├── /errors
│   │   │   └── exception.filter.ts      # Estandarización de salidas de error HTTP
│   │   └── /utils
│   │
│   ├── app.module.ts           # Módulo Raíz (Bootstrap NestJS)
│   └── main.ts                 
│
├── /scripts                    # WORKFLOW Y REGLAS DE ESPACIO DE TRABAJO
│   └── validate-modules.ts     # Script de análisis estático (Pre-commit)
├── package.json
└── tsconfig.json



3. Ciclo de Ejecución de la Petición (Flujo Lógico)

Cada petición sigue un proceso determinista y unidireccional. La interrupción por fallo en cualquier etapa aborta el proceso y retorna un error controlado.

Recepción (Gateway): El cliente envía un objeto JSON { subject: "accion", payload: { ... } } al endpoint /dispatch.

Interceptación de Seguridad: * AuthGuard valida el JWT.

TenantResolver establece el contexto del inquilino activo. El sistema verifica la caché de permisos para evitar consultas redundantes a la base de datos de sesión.

Resolución de Configuración: RegistryService busca en memoria la definición correspondiente al subject. Si no existe, rechaza con 404 Not Found.

Autorización (RBAC): El sistema verifica si el rol del usuario contenido en el JWT tiene permisos explícitos para ejecutar este módulo (allowedRoles). Si falla, 403 Forbidden.

Validación de Entrada y Trazabilidad Granular (Campos a recibir): ValidatorService procesa el payload contra el esquema Zod del módulo en modo estricto. Si los datos no cumplen el contrato exacto, la ejecución se detiene inmediatamente. Se retorna un error 400 Bad Request exponiendo de manera clara y granular la falla específica para el subject invocado:

Falta un dato: Indica el nombre exacto de la propiedad requerida omitida.

Dato extra: Rechaza la petición si el payload contiene propiedades no definidas en el contrato (prevención de contaminación de parámetros).

Tipo inválido: Especifica la discrepancia de tipos (ej. se esperaba number, se recibió string).

Ejecución Lógica (Transaccional):

El TenantManager aísla la conexión de base de datos.

El QueryAssembler parametriza las variables para ejecutar la plantilla SQL (la lógica de negocio pura).

Interceptación de Errores de Negocio (Fallo SQL): Si la base de datos devuelve un error (ej. llave duplicada o violación de restricción), se ejecuta la función errorHandler del módulo para mutar el error técnico a una excepción HTTP clara (ej. 409 Conflict), evitando fugas de información de la infraestructura SQL.

Transformación (Campos a devolver): La respuesta SQL cruda pasa por la función outputTransformer del módulo para descartar campos internos y dar formato al JSON jerárquico esperado.

Post-Ejecución: Se ejecuta asíncronamente el postHook (ej. integrar con sistema contable externo) si está definido.

Retorno: El sistema emite la respuesta final al cliente.

4. Contrato Estricto de Metadatos (ConcretBillModule)

El diseño que permite la creación acelerada y la integración de agentes automatizados depende de este contrato TypeScript. Para crear un nuevo módulo, un desarrollador (o agente) solo necesita completar esta interfaz:

import { z } from 'zod';

export interface ConcretBillErrorContext {
  error: any;
  payload: any;
  tenantId: string;
}

export interface ConcretBillModule<TInput = any, TOutput = any> {
  // 1. Identificador del módulo
  subject: string;
  
  // 2. Validación de Usuario (Permisos)
  rbacSettings: {
    allowedRoles: string[];
  };
  
  // 3. Campos a recibir (Validación Zod Estricta)
  // Nota: Debe utilizarse z.object({...}).strict() para rechazar datos adicionales.
  payloadSchema: z.ZodType<TInput>;
  
  // 4. Lógica de negocio (Consulta SQL parametrizada)
  sqlExecution: {
    type: 'query' | 'mutation';
    query: string; // Requiere marcadores de posición seguros
  };
  
  // 5. Campos a devolver (Transformación de la salida SQL)
  outputTransformer: (rawSqlResult: any[]) => TOutput;

  // 6. Manejo de excepciones locales y de base de datos
  errorHandler?: (context: ConcretBillErrorContext) => never;
  
  // 7. Lógica post-persistencia (Opcional)
  postHook?: (result: TOutput, context: any) => Promise<void>;
}



5. Workflow de Desarrollo Acelerado (Agentic & Humano)

El diseño de ConcretBill garantiza que el esfuerzo se enfoque exclusivamente en los datos y la lógica SQL, permitiendo ciclos de entrega extremadamente rápidos.

Fases de Operación

Definición Estructural (DB): Se define la estructura tabular requerida en un script de migración puro dentro de /database/migrations/.

Declaración del Módulo: Se crea el archivo subject.ts en la capa /modules/. Se llena el contrato ConcretBillModule con la configuración de entrada, salida, seguridad y la instrucción SQL. (Esta fase es idónea para ser automatizada por un agente generador de código).

Validación de Espacio de Trabajo (Pre-commit): El script /scripts/validate-modules.ts analiza la carpeta de módulos buscando fallos en el contrato o riesgos de inyección SQL (interpolación directa prohibida).

Despliegue y Registro en Caliente: Al iniciar o recargar, RegistryService lee el directorio, indexa el nuevo subject, y el endpoint queda inmediatamente expuesto en /dispatch.

6. Acotación: Gestión del Estado y Sesión (Frontend)

Para optimizar el uso de los módulos en aplicaciones cliente, ConcretBill operará bajo el patrón "Stateless" con carga inicial de contexto.

Session Context Loading: Al iniciar sesión, el cliente despacha una petición al subject de sistema sys.session.init.

Respuesta Consolidada: ConcretBill devuelve un bloque JSON con el perfil del usuario, la matriz de permisos y la configuración del inquilino (Tenant).

Gestión de Cliente: El Frontend retiene esta información en memoria (Zustand/Redux), validando la visibilidad de componentes de la interfaz de forma local, minimizando llamadas de autorización redundantes al backend.