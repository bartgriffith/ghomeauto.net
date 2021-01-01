import { Injectable } from "@angular/core";
import { Device } from "../models/device";
import { GFamApiService } from "./gFamApi.service";

@Injectable()
export class RoutineService {

    devices: Device[] = [];

    constructor(private gFamApiService: GFamApiService) {
        this.gFamApiService.devices$.subscribe((devices: Device[]) => {
            this.devices = devices;
        })
    }

    turnOnFloodLights() {
        this.devices.filter(
            d => d.name.toLowerCase().includes('flood'))
            .forEach(d => {
                if (!d.on) {
                    d.on = true;
                    this.gFamApiService.setDeviceStatus(d);
                }
        });
    }

    turnOffFloodLights() {
        this.devices.filter(
            d => d.name.toLowerCase().includes('flood'))
            .forEach(d => {
                if (d.on) {
                    d.on = false;
                    this.gFamApiService.setDeviceStatus(d);
                }
        });
    }

    turnOnAllInRoom(room: string) {
        this.devices.filter(
            d => d.room === room)
            .forEach(d => {
                if (!d.on) {
                    d.on = true;
                    this.gFamApiService.setDeviceStatus(d);
                }
            });
    }

    turnOffAllInRoom(room: string) {
        this.devices.filter(
            d => d.room === room)
            .forEach(d => {
                if (d.on) {
                    d.on = false;
                    this.gFamApiService.setDeviceStatus(d);
                }
            });
    }

    turnOnAllExterior() {
        this.devices.filter(
            d => d.room === 'Back Yard' || d.room === 'Front Yard' || d.name === 'Breezeway Light')
            .forEach(d => {
                if (!d.on) {
                    d.on = true;
                    this.gFamApiService.setDeviceStatus(d);
                }
            });
    }

    turnOffAllExterior() {
        this.devices.filter(
            d => d.room === 'Back Yard' || d.room === 'Front Yard' || d.name === 'Breezeway Light')
            .forEach(d => {
                if (d.on) {
                    d.on = false;
                    this.gFamApiService.setDeviceStatus(d);
                }
            });
    }

    nightNight() {
        this.devices.filter(
            d => d.name !== 'Master Fan' && d.name !== 'Christmas Tree')
            .forEach(d => {
                if (d.on) {
                    d.on = false;
                    this.gFamApiService.setDeviceStatus(d);
                }
            });

        const masterFan = this.devices.find(d => d.name === 'Master Fan');
        const xmasTree = this.devices.find(d => d.name === 'Christmas Tree');
        
        if (!masterFan.on) {
            masterFan.on = true;
            this.gFamApiService.setDeviceStatus(masterFan);
        }
        if (!xmasTree.on) {
            xmasTree.on = true;
            this.gFamApiService.setDeviceStatus(xmasTree);
        }
    }
}