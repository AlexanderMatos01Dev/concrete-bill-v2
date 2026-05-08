import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RegistryService } from '../../core/registry/registry.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly registry: RegistryService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { subject } = request.body;

    if (!subject) {
      return true; // Dejamos que el controlador o ExecutionService manejen la falta de subject
    }

    const moduleDefinition = this.registry.getModule(subject);
    if (!moduleDefinition) {
      throw new NotFoundException(`El subject [${subject}] no está registrado.`);
    }

    // Simulamos la obtención del rol del usuario desde el request (previamente cargado por un AuthGuard)
    // En producción esto vendría del JWT: request.user.role
    const userRole = request.headers['x-user-role'] || 'guest';

    const isAllowed = moduleDefinition.rbacSettings.allowedRoles.includes(userRole) || 
                      moduleDefinition.rbacSettings.allowedRoles.includes('*');

    if (!isAllowed) {
      throw new ForbiddenException(`Tu rol [${userRole}] no tiene permiso para ejecutar [${subject}].`);
    }

    return true;
  }
}
