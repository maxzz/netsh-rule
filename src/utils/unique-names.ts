import path from 'path';
import fs from 'fs';
import { exist } from './utils-os';

function zeros(v: string | number, total: number): string {
    // Returns v prefixed with '0's with length <= total or v as is.
    v = v ? '' + v : '';
    return v.length < total ? '0000000000'.slice(0, total - v.length) + v : v;
}

function getDesktopPath(): string {
    if (!process.env.USERPROFILE) {
        throw Error('User HOME is undefined');
    }
    return path.join(process.env.USERPROFILE, 'Desktop');
}

function nowDay(d: Date): string {
    return `${zeros(d.getMonth() + 1, 2)}.${zeros(d.getDate(), 2)}.${d.getFullYear() % 100}`;
}

function nowTime(d: Date): string {
    return `${zeros(d.getHours(), 2)}.${zeros(d.getMinutes(), 2)}.${zeros(d.getSeconds(), 2)}.${zeros(d.getMilliseconds(), 3)}`;
}

function nowDayTime(delimiter: string = ' at ') {
    let d: Date = new Date();
    return `${nowDay(d)}${delimiter}${nowTime(d)}`;
}

function ensureNameUnique(name: string, nameIsFname: boolean = true): string {
    // 0. Ensure that file/folder name is unique.
    let basename: string, ext: string = '', index: number = 0, initialized: boolean = false;
    while (1) {
        let st: fs.Stats = exist(name);
        if (!st || (st.isDirectory() === nameIsFname)) { // case if folder exist but we create file name.
            return name;
        }
        if (!initialized) {
            let org: path.ParsedPath = path.parse(name);
            if (nameIsFname) {
                org.base = org.name; // to set base name wo/ ext.
                ext = org.ext; // folder name may have '.', so keep ext only for file names.
            }
            org.ext = '';
            basename = path.format(org);
            initialized = true;
        }
        index++;
        name = `${basename} (${index})${ext}`;
    }
} //ensureNameUnique()

export function uniqueFolderName(prefix: string): string {
    return ensureNameUnique(`${getDesktopPath()}/${prefix} ${nowDayTime()}`, false);
}

export function uniqueFileName(prefix: string): string {
    return ensureNameUnique(`${getDesktopPath()}/${prefix} ${nowDayTime()}`, true);
}
