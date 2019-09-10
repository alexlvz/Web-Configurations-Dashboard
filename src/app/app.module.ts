import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material';
import {MAT_DIALOG_DEFAULT_OPTIONS} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTabsModule} from '@angular/material/tabs';
import { HomepageComponent } from './homepage/homepage.component';
import {MatTreeModule} from '@angular/material/tree';
import { PopupWindowComponent } from './popup-window/popup-window.component';
import { ReactiveFormsModule } from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import { HttpClientModule } from "@angular/common/http";
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import {MatListModule} from '@angular/material/list';


@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    HomepageComponent,
    PopupWindowComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatDialogModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatTreeModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    HttpClientModule,
    BsDropdownModule.forRoot(),
    MatListModule,
    ReactiveFormsModule.withConfig({warnOnNgModelWithFormControl: 'never'})
  ],
  providers: [ {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}}],
  entryComponents: [
    PopupWindowComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
