import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { app } from 'electron';
export class Store {
    constructor() {
        this.cwd = join(app.getPath('userData'), 'config.json');
        console.log(this.cwd);
        const data = readFileSync(this.cwd, { encoding: 'utf-8', flag: 'r' });
        try {
            this.cfg = JSON.parse(data);
        }
        catch (_) {
            this.cfg = this.defaultConfig;
            this.save();
        }
    }
    getAll() {
        return this.cfg;
    }
    get(key) {
        return this.cfg[key];
    }
    update(key, newValue) {
        this.cfg[key] = newValue;
        return newValue;
    }
    save() {
        writeFileSync(this.cwd, JSON.stringify(this.cfg));
    }
    get defaultConfig() {
        return {
            linksWhitelist: [],
            linksBlacklist: [],
            downloadMethod: 'jd',
            qualities: '720p'
        };
    }
}
//# sourceMappingURL=electron-store.js.map