import { PSAShowRelease } from './PSARelease.interface';

export enum PSAJobStatus {
  STARTING = 0,
  EXTRACTED = 1,
  DOWNLOADING = 2,
  DONE = 3,
  FAILED = -1
}

export interface PSAJobData {
  id: string;
  status: PSAJobStatus;
  errorMessage?: string;
  release: Partial<PSAShowRelease>;
}