import { join } from 'path';
import { readFileSync, write, writeFile, writeFileSync } from 'fs';
import { app } from 'electron';

export class Store {

  cwd: string;
  cfg: any;

  constructor() {
    this.cwd = join(app.getPath('userData'), 'config.json');

    console.log(this.cwd);

    const data = readFileSync(this.cwd, { encoding: 'utf-8', flag: 'r' });

    try {
      this.cfg = JSON.parse(data);
    } catch (_) {
      this.cfg = this.defaultConfig;
      this.save();
    }
  }

  getAll(): any {
    return this.cfg;
  }

  get(key: string): any {
    return this.cfg[key];
  }

  update<T>(key: string, newValue: T): T {
    this.cfg[key] = newValue;
    return newValue;
  }

  save(): void {
    writeFileSync(this.cwd, JSON.stringify(this.cfg));
  }

  private get defaultConfig() {
    return {
      linksWhitelist: [],
      linksBlacklist: [],
      downloadMethod: 'jd',
      qualities: '720p'
    };
  }
}