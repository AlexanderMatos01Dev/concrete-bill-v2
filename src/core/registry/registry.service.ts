import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { glob } from 'glob';
import * as path from 'path';
import { ConcretBillModule } from '../../shared/interfaces/concretbill-module.interface';

@Injectable()
export class RegistryService implements OnModuleInit {
  private readonly logger = new Logger(RegistryService.name);
  private readonly subjects = new Map<string, ConcretBillModule>();

  async onModuleInit() {
    await this.loadModules();
  }

  private async loadModules() {
    // Intentamos buscar en dist/modules y src/modules
    const modulesPath = path.join(__dirname, '../../modules');
    this.logger.debug(`[DEBUG] Escaneando módulos en: ${modulesPath}`);
    
    const files = await glob('**/*.{ts,js}', { 
      cwd: modulesPath,
      ignore: ['**/*.d.ts', 'index.ts', 'index.js']
    });

    this.logger.debug(`[DEBUG] Archivos encontrados: ${JSON.stringify(files)}`);

    for (const file of files) {
      try {
        const absolutePath = path.resolve(modulesPath, file);
        this.logger.debug(`[DEBUG] Intentando cargar: ${absolutePath}`);
        
        // Limpiar caché y cargar
        delete require.cache[require.resolve(absolutePath)];
        const moduleImport = require(absolutePath);
        
        // Intentar obtener el módulo de diferentes formas de exportación
        const concretModule: ConcretBillModule = moduleImport.default || moduleImport.module || moduleImport;

        if (concretModule && concretModule.subject) {
          this.subjects.set(concretModule.subject, concretModule);
          this.logger.log(`Subject registrado: [${concretModule.subject}] desde ${file}`);
        } else {
          this.logger.warn(`[WARN] El archivo ${file} no exporta un ConcretBillModule válido.`);
        }
      } catch (error) {
        this.logger.error(`[ERROR] Fallo cargando módulo ${file}: ${error.stack}`);
      }
    }

    this.logger.log(`Total de subjects cargados: ${this.subjects.size}`);
  }

  getModule(subject: string): ConcretBillModule | undefined {
    return this.subjects.get(subject);
  }

  getAllSubjects(): string[] {
    return Array.from(this.subjects.keys());
  }
}
