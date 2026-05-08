import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ExecutionService } from '../../core/executor/execution.service';
import { RbacGuard } from '../guards/rbac.guard';

@Controller('dispatch')
export class DispatcherController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  @UseGuards(RbacGuard)
  async dispatch(
    @Body() body: { subject: string; payload: any },
    @Req() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant-id';
    const userRole = req.headers['x-user-role'] || 'guest';
    
    return await this.executionService.execute(
      body.subject,
      body.payload,
      tenantId,
    );
  }
}
