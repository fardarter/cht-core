import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CHTScriptApiService {
  isInitialized(): any {
    throw new Error('Method not implemented.');
  }

  async getApi(): Promise<any> {
    console.log('CHTScriptApiService.getApi()');
    return {};
  }
}
