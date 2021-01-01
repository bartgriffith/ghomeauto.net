import { Pipe, PipeTransform } from '@angular/core';
import { Device } from '../models/device';

@Pipe({
    name: 'roomFilter',
    pure: false
})
export class RoomFilterPipe implements PipeTransform {
    transform(devices: Device[], room: string): any {
        if (!devices) {
            return devices;
        }

        return devices.filter(device => device.room === room);
    }
}