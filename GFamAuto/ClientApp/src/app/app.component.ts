import { Component, OnInit } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSliderChange } from '@angular/material/slider';
import { Device } from './models/device';
import { GFamApiService } from './services/gFamApi.service';
import { RoutineService } from './services/routine.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'tuya-test';
  rooms = ['Back Yard', 'Entryway', 'Front Yard', 'Garage', 'Kitchen', 'Living Room', 'Master Bedroom', 'South Beam'];
  public devices: Device[];
  
  deviceSubject = new WebSocketSubject<Device[]>('ws://localhost:3008');

  constructor(
    private gFamApiService: GFamApiService,
    private routineService: RoutineService) {}
  
  ngOnInit() {
    this.gFamApiService.devices$.subscribe(devices => {
      this.devices = devices;
    });

    // this.gFamApiService.getAllDeviceStatus();

    this.deviceSubject.subscribe(
      data => {
        console.log('Socket data received.');
        console.log(data);
      },
      err => {
        console.log('Socket error received.');
        console.log(err);
      }
    );
  }

  onToggle(event: MatSlideToggleChange, device: Device) {
    const deviceConfig: Device = {
      name: device.name,
      id: device.id,
      key: device.key,
      urlname: device.urlname,
      on: event.checked
    };
    this.gFamApiService.setDeviceStatus(deviceConfig);
  }

  onSlider(event: MatSliderChange, device: Device) {
    console.log(device);
    const deviceConfig: Device = {
      name: device.name,
      id: device.id,
      key: device.key,
      urlname: device.urlname,
      brightness: event.value
    };
    // if (device['101'] !== undefined) {
    //   deviceConfig['101'] = device['101'];
    // }
    this.gFamApiService.setDeviceStatus(deviceConfig);
  }

  onColorToggle(event: MatSlideToggleChange, device: Device) {
    device.color = event.checked;
    this.gFamApiService.setDeviceStatus(device);
  }

  onAllFloodsOn() {
    this.routineService.turnOnFloodLights();
  }

  onAllFloodsOff() {
    this.routineService.turnOffFloodLights();
  }

  allOnByRoom(room: string) {
    this.routineService.turnOnAllInRoom(room);
  }

  allOffByRoom(room: string) {
    this.routineService.turnOffAllInRoom(room);
  }

  onAllExteriorOn() {
    this.routineService.turnOnAllExterior();
  }

  onAllExteriorOff() {
    this.routineService.turnOffAllExterior();
  }

  onNightNight() {
    this.routineService.nightNight();
  }
}
