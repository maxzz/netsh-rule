import minimist from 'minimist';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { exist, uniqueFileName, toUnix, toWindows } from './unique-names';
import { genearateFile } from './generate';

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
    files: string [];   // collected after argumnets parsed.
    dest: string;       // The destination output filename.
    root: string;       // root folder
    nameRoot: string;   // shrinked name of the root folder wo/ path, or parent folder if file was specified.
}

function help(info?: string) {
    const msg =
`
netsh-rules will generate a batch file to manage inbound and outbound Windows
firewall connections for a single exe file or all exe files in folder.

Usage:
    netsh-rules <absolute path to filename | absolute path to folder> [options]

Options:
    --name    - The rule name (name will be generated from the last folder if not specified)
    --program - Absolute path to <filename | folder>
    --enable  - Enable rule: yes | no (default: yes)
    --dir     - The rule is inbound or outbound: in | out | both (default: both i.e. in and out)
    --action  - The action for rule: allow | block (default: block)
    --profile - Apply rule for: public | private | domain (default: public, private, domain)
    --format  - Output format can be batch file, powershell, or javascript: bat | ps1 | js (default: bat)
`;
    console.log(chalk.gray(msg));

    if (info) {
        console.log(chalk.red(info));
    }

    console.log('');
}

function checkArgs() {
    // 1. get and verify arguments
    let args = minimist(process.argv.slice(2), {
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

    !args.program && (args.program = args._[0]);

    checkArg(args.enable, 'enable', ['yes', 'no']);
    checkArg(args.action, 'action', ['allow', 'block']);
    checkArg(args.dir, 'dir', ['in', 'out', 'both']);
    checkArg(args.profile, 'profile', ['public', 'private', 'domain']);
    checkArg(args.format, 'format', ['bat', 'ps1', 'js']);

    // 2. prepare source files

    if (!args.program) {
        help('Nothing to process');
        process.exit(1);
    }

    const st = exist(args.program);
    if (!st) {
        help(`Source not found: ${args.program}`);
        process.exit(2);
    }

    args.program = path.normalize(args.program);

    if (st.isDirectory()) {
        // collect files
        let files = [];
        collectExeFiles(args.program, files, true);
        args.files = filterDuplicated(files);
        // prepare root
        args.root = args.program;
        args.nameRoot = args.program.split(path.sep).pop().replace(/ /g, '');
    } else {
        // collect files
        args.files.push(args.program);
        // prepare root
        args.root = path.dirname(args.program);
        args.nameRoot = args.root.split(path.sep).pop().replace(/ /g, '');
    }
    //args.files = args.files.map(toWindows); // netsh accepts only back slashes
    args.files = args.files.map(path.normalize); // netsh accepts only back slashes

    args.files.sort((a, b) => a.length - b.length); // shortest first

    console.log(chalk.yellow('Found exe files:'));
    console.log(chalk.yellow(`${args.files.map((_) => `    ${_}\n`).join('')}`));

    // 3. prepate dest output filename
    
    args.dest = `${uniqueFileName('netsh-rules')}.${args.format}`;

    //console.log(chalk.yellow(JSON.stringify(args, null, 4)));
    return args;

    function collectExeFiles(folder: string, rv: string[], recursive: boolean): void {
        rv.push(...fs.readdirSync(folder).map((_) => {
            let fname = path.join(folder, _);
            let _st = fs.statSync(fname);
            if (_st.isDirectory()) {
                recursive && collectExeFiles(fname, rv, recursive);
            } else {
                return _st.isFile() && path.extname(_).toLowerCase() === '.exe' ? fname : '';
            }
        }).filter(Boolean));
    }

    function filterDuplicated(names: string[]): string[] {
        return [...new Map(names.map(_ => [_.toLowerCase(), _])).values()]; // leave unique and preserve names case.
    }

    function checkArg(value: string, name: string, allowed: string[]): void {
        let s = (value || '').trim();
        if (!s) {
            help(`Required argument '${name}' is missing. Allowed values are '${allowed.join(' | ')}'`);
            process.exit(3);
        }
        let arr = s.toLowerCase().split(',').map(_ => _.trim().toLowerCase());
        arr.forEach((src) => {
            if (!allowed.includes(src)) {
                help(`Invalid argument '${name} = ${value}'. Allowed values are '${allowed.join(' | ')}'`);
                process.exit(3);
            }
        });
    }
} //checkArgs()

function main() {
    let args = checkArgs();

    let content = genearateFile(args);
    if (content) {
        fs.writeFileSync(args.dest, content);
    } else {
        console.log(chalk.yellow('Generated nothing'));
    }
} //main()

main();
