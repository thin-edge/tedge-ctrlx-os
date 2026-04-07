import { NgModule } from '@angular/core';
import {
  CoreModule,
} from '@c8y/ngx-components';
import { EventsComponent } from './event/events.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PopoverModule } from 'ngx-bootstrap/popover';

@NgModule({
  imports: [
    CoreModule,
    BsDropdownModule.forRoot(),
    PopoverModule,
  ],
  declarations: [
    EventsComponent,
  ],
  exports: [EventsComponent]
})
export class SharedModule {}
