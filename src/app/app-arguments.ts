import path from "path";
import fs from "fs";
import minimist from 'minimist';
import chalk from "chalk";
import { uniqueFileName } from "../utils/unique-names";
import { terminate } from "./app-errors";
import { exist } from "../utils/utils-os";

export type Args = {
    name: string;       // name=<Name of the rule you want >
    program: string;    // program=<”Path of the executable”>
    enable: string;     // enable=yes or no
    dir: string;        // dir=Inbound(in) or outbound(out) rule
    action: string;     // action=allow or block or custom
    profile: string;    // ( To add rule in more than one profile use “,” e.g.: profile=private, domain )
    format: string;     // The output format: bat | ps1 | js (default is bat)
    //                  // Generated parameters
    _: string[];        // Nameless parameters.
    files: string[];    // collected after argumnets parsed.
    dest: string;       // The destination output filename.
    root: string;       // root folder
    nameRoot: string;   // shrinked name of the root folder wo/ path, or parent folder if file was specified.
};

export function checkArgs(): Args {
    // 1. get and verify arguments

    const args = getCliArgs();
    verifyMinimistArgs(args);

    // 2. prepare source files

    const st = exist(args.program);
    if (!st) {
        console.log('st', JSON.stringify(st, null, 4));
        terminate(`Source not found: ${args.program}`, 2);
    }

    if (st.isDirectory()) {
        // prepare root
        args.program = args.program.replace(new RegExp(`${path.sep}${path.sep}$`), ''); // remove last slash from folder name
        args.root = args.program;
        args.nameRoot = args.name || args.program.split(path.sep).pop().replace(/ /g, '');
        // collect files
        let files = [];
        collectRecursivelyExeFiles(args.program, files, true);
        args.files = filterDuplicated(files);
    } else {
        // prepare root
        args.root = path.dirname(args.program);
        args.nameRoot = args.name || args.root.split(path.sep).pop().replace(/ /g, '');
        // collect files
        args.files.push(args.program);
    }
    //args.files = args.files.map(toWindows); // netsh accepts only back slashes
    args.files = args.files.map(path.normalize); // netsh accepts only back slashes

    args.files.sort((a, b) => a.length - b.length); // shortest first

    console.log(chalk.yellow('Found exe files:'));
    console.log(chalk.yellow(`${args.files.map((_) => `    ${_}\n`).join('')}`));

    // 3. prepate dest output filename

    args.dest = `${uniqueFileName('netsh-rules')}.${args.format}`;

    //console.log(chalk.red(JSON.stringify(args, null, 4)));
    return args;
}

function getCliArgs(): Args {
    const rv = minimist(
        process.argv.slice(2),
        {
            string: ['name', 'action', 'enable', 'dir', 'profile', 'program', 'format'],
            default: {
                name: '',
                enable: 'yes',
                action: 'block',
                dir: 'both',
                profile: 'public,private,domain',
                // generated defaults:
                files: [],
                format: 'bat',
                nameRoot: '',
            }
        }) as Args;
    return rv;
}

function verifyMinimistArgs(args: Args) {
    if (args._.length > 1) {
        terminate('Only one filename or folder can be specified', 1);
    }

    !args.program && (args.program = args._[0]);

    checkArg(args.enable, 'enable', ['yes', 'no']);
    checkArg(args.action, 'action', ['allow', 'block']);
    checkArg(args.dir, 'dir', ['in', 'out', 'both']);
    checkArg(args.profile, 'profile', ['public', 'private', 'domain']);
    checkArg(args.format, 'format', ['bat', 'ps1', 'js']);

    if (!args.program) {
        terminate('Nothing to process', 1);
    }

    args.program = args.program.replace(/"$/, ''); // remove quota if path is "c:\abc\" on Win10 the last \" becomes "
    args.program = path.normalize(args.program);

    return args;

    function checkArg(value: string, name: string, allowed: string[]): void {
        const s = (value || '').trim();
        if (!s) {
            terminate(`Required argument '${name}' is missing. Allowed values are '${allowed.join(' | ')}'`, 3);
        }

        const arr = s.toLowerCase().split(',').map(_ => _.trim().toLowerCase());
        arr.forEach(
            (src) => {
                if (!allowed.includes(src)) {
                    terminate(`Invalid argument '${name} = ${value}'. Allowed values are '${allowed.join(' | ')}'`, 3);
                }
            }
        );
    }
}

function collectRecursivelyExeFiles(folder: string, rv: string[], recursive: boolean): void {
    rv.push(...fs.readdirSync(folder).map((item) => {
        const fullname = path.join(folder, item);
        const _st = fs.statSync(fullname);
        if (_st.isDirectory()) {
            recursive && collectRecursivelyExeFiles(fullname, rv, recursive);
        } else {
            return _st.isFile() && path.extname(item).toLowerCase() === '.exe' ? fullname : '';
        }
    }).filter(Boolean));
}

function filterDuplicated(names: string[]): string[] {
    return [...new Map(names.map(_ => [_.toLowerCase(), _])).values()]; // leave unique and preserve names case.
}
