import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';

import { GFamApiService } from './services/gFamApi.service';
import { RoutineService } from './services/routine.service';

import { RoomFilterPipe } from './pipes/room.pipe';

@NgModule({
  declarations: [
    AppComponent,
    RoomFilterPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    HttpClientModule,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatSlideToggleModule,
    MatSliderModule
  ],
  providers: [GFamApiService, RoutineService],
  bootstrap: [AppComponent]
})
export class AppModule { }
