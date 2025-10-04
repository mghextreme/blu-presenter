import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Organization,
  OrganizationUser,
  OrganizationInvitation,
  User,
} from '../entities';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService, OrganizationsBaseService } from './organizations.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationUser,
      OrganizationInvitation,
      User,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsBaseService],
  exports: [OrganizationsService, OrganizationsBaseService],
})
export class OrganizationsModule {}
