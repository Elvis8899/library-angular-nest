import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { ListUsersComponent } from './listUsers/listUsers.component';
import { AddUsersComponent } from './addUser/addUser.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ListUsersComponent, AddUsersComponent],
  imports: [CommonModule, UsersRoutingModule, ReactiveFormsModule],
})
export class UsersModule {}
