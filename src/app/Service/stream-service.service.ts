
import { Plane } from '../target'; // Adjust the path as necessary
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StreamServiceService {

  private extractJSON(string: string): any[] {
    const results = string.match(/\{(?:[^{}])*\}/g);
    return results ? results.map(res => JSON.parse(res)) : [];
  }

  listenToStream(): Observable<{ satellite: Plane[]; terrestrial: Plane[] }> {
    return new Observable(observer => {
      fetch(`https://api.airsafe.spire.com/v2/targets/stream?compression=none`, {
        headers: {
          Authorization: `Bearer tHkcJG5CGq3VzgTjcApGNE5ZB0YNvE6b`,
        },
      })
        .then(async (response) => {
          if (response.status === 401) {
            observer.error('Unauthorized');
            return;
          }
  
          const stream = response.body?.getReader();
          if (!stream) {
            observer.error('Stream not available');
            return;
          }
  
          const currentData: { satellite: Plane[]; terrestrial: Plane[] } = {
            satellite: [],
            terrestrial: [],
          };
  
          while (true) {
            const { value, done } = await stream.read() as { value: Uint8Array; done: boolean; };
            if (done) {
              break;
            }
            try {
              const parsedPlanes = this.extractJSON(new TextDecoder("utf-8").decode(value));
              console.log('Parsed data:', parsedPlanes);
              parsedPlanes.forEach((parsed: Plane) => {
                if (parsed.icao_address) {
                  currentData[parsed.collection_type].push(parsed);
                }
              });
  
              console.log('Current data:', currentData);
              observer.next(currentData);
            } catch (e) {
              observer.error('An error occurred while parsing stream results');
            }
          }
        })
        .catch(e => {
          observer.error('An error occurred while calling the endpoint');
        });
    });
  }
  
}
