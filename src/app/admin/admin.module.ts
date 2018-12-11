import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AdminComponent } from './admin.component';

import { AdminRoutingModule } from './admin-routing.module';
import { TranslateModule } from 'ng2-translate';

// Pipes
import { PipeModule } from '../pipes/pipes.module';
import {TabViewModule, DropdownModule, DataTableModule} from 'primeng/primeng';

@NgModule({
  imports: [
    AdminRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    PipeModule.forRoot(),
    TabViewModule,
    DropdownModule,
    DataTableModule,
    
  ],
  declarations: [
    AdminComponent
  ]
})
export class AdminModule { }