import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Device } from "../models/device";

@Injectable()
export class GFamApiService {
    devices$ = new BehaviorSubject<Device[]>([]);

    constructor(private httpClient: HttpClient) { }

    getAllDeviceStatus() {
        this.httpClient.get('http://localhost:3007/fetch_all').subscribe((data: Device[]) => {
            data.sort((a, b) => (a.room > b.room) ? 1 : (a.room === b.room) ? ((a.name > b.name) ? 1 : -1) : -1);
            this.devices$.next(data);
        });
    }

    getDeviceStatus() {}

    setDeviceStatus(device: Device) {
        this.httpClient.post('http://localhost:3007/set/' + device.urlname, device).subscribe((data: Device) => {
            console.log(data);
        });
    }
}