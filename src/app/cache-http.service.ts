import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const CACHE_REQUESTS = 'CACHE_REQUESTS_DATA';
const CACHE_DURATION = 'CACHE_DURATION';
interface CacheRequestData {
  url: string,
  response: unknown,
  date: Date
}

@Injectable()
export class CacheHttpService {
  cacheRequests$: BehaviorSubject<CacheRequestData[]> = new BehaviorSubject<CacheRequestData[]>([]);
  cacheDuration$: BehaviorSubject<number> = new BehaviorSubject<number>(null); // en seconds

  constructor(private httpClient: HttpClient) {
    // load cache Duration 
    const cacheDurationStr = localStorage.getItem(CACHE_DURATION);
    if (cacheDurationStr) {
      this.cacheDuration$.next(JSON.parse(cacheDurationStr));
    } else {
      this.cacheDuration$.next(60); // 60 seconds is the default cache duration
    }
    // load cache data 
    const cacheRequestsStr = localStorage.getItem(CACHE_REQUESTS);
    if (cacheRequestsStr) {
      this.cacheRequests$.next(JSON.parse(cacheRequestsStr));
    }
  }

  get<T>(...params: Parameters<typeof this.httpClient.get>): ReturnType<typeof this.httpClient.get<T>> {
    const url = params[0];
    if (!this.requestExistInCache(url) || this.requestIsExpired(url)) {
      return this.httpClient.get<T>(url)
        .pipe(tap((response: T) => this.setReponseInCache(url, response)));
    } else {
      return of(this.getReponseFromCache(url));
    }
  }

  requestExistInCache(url: string): boolean {
    const data = this.cacheRequests$.getValue();
    const index = data.findIndex((data: CacheRequestData) => data.url === url)
    return index !== -1;
  }

  requestIsExpired(url: string): boolean {
    const data = this.cacheRequests$.getValue();
    const index = data.findIndex((data: CacheRequestData) => data.url === url)
    if (index !== -1) {
      // request is exist in cache 
      const requestDate = new Date(data[index].date);
      const currentDate = new Date();
      const secondsDiff = Math.round((currentDate.getTime() - requestDate.getTime()) / 1000)
      if (secondsDiff >= this.cacheDuration$.getValue()) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  getReponseFromCache<T>(url: string): T {
    const data = this.cacheRequests$.getValue();
    const index = data.findIndex((data: CacheRequestData) => data.url === url)
    if (index !== -1) {
      return data[index].response as T;
    } else {
      return null;
    }
  }

  setReponseInCache(url: string, response: unknown) {
    const data = this.cacheRequests$.getValue();
    const index = data.findIndex((data: CacheRequestData) => data.url === url)
    if (index !== -1) {
      // reponse exist in cache then update the cache with the current date & the lastest response of this url
      data.splice(index, 1, { url: url, response: response, date: new Date() })
      this.cacheRequests$.next(data)
    } else {
      // reponse not exist in cache so added it
      this.cacheRequests$.next([...data, { url: url, response: response, date: new Date() }])
    }
    localStorage.setItem(CACHE_REQUESTS, JSON.stringify(this.cacheRequests$.getValue()));
  }

}
