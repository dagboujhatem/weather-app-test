import { Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';

export const LOCATIONS : string = "locations";

@Injectable()
export class LocationService {

  locations : string[] = [];
  addedLocationSubject$: Subject<string> = new ReplaySubject();
  removeLocationSubject$: Subject<string> = new Subject();

  constructor() {
    let locString = localStorage.getItem(LOCATIONS);
    if (locString)
      this.locations = JSON.parse(locString);
    for (let loc of this.locations)
      this.addedLocationSubject$.next(loc)
  }

  addLocation(zipcode : string) {
    this.locations.push(zipcode);
    localStorage.setItem(LOCATIONS, JSON.stringify(this.locations));
    this.addedLocationSubject$.next(zipcode)
  }

  removeLocation(zipcode : string) {
    let index = this.locations.indexOf(zipcode);
    if (index !== -1){
      this.locations.splice(index, 1);
      localStorage.setItem(LOCATIONS, JSON.stringify(this.locations));
      this.removeLocationSubject$.next(zipcode);
    }
  }
}
