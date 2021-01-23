import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PSAJobData, PSAJobStatus } from '../model/PSAJobData.interface';

@Injectable({
  providedIn: 'root'
})
export class JobService {

  private allJobs$: BehaviorSubject<PSAJobData[]>;
  private allJobs: PSAJobData[];

  constructor() { 
    this.allJobs = [];
    this.allJobs$ = new BehaviorSubject(this.allJobs);
  }

  onJobsChanged(): Observable<PSAJobData[]> {
    return this.allJobs$.asObservable();
  }

  addNewJob(job: PSAJobData): void {

    this.allJobs.push(job);
    this.allJobs$.next(this.allJobs);
  }

  updateJob(updateId: string, newJobData: Partial<PSAJobData>): void {

    const idx = this.allJobs.findIndex(({ id }) => id === updateId);

    // mutates the array
    this.allJobs[idx] = { 
      ...this.allJobs[idx],
      ...newJobData
    };
    this.allJobs$.next(this.allJobs);
  }

  removeJob(removedId: string): void {

    this.allJobs = this.allJobs.filter(({ id }) => id !== removedId);
    this.allJobs$.next(this.allJobs);
  }

}
