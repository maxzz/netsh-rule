import minimist from 'minimist';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { exist, uniqueFileName, toUnix, toWindows } from './unique-names';
import { genearateBatchFile, genearatePowershellFile, genearateJsFile } from './generate';
import { connect } from 'http2';

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
    //unix: boolean;      // Convert back slashed to slashed.
}

function help(info?: string) {
    const msg = 
`
netsh-rules will generate a batch file to manage inbound and outbound Windows
firewall connections for a single exe file or all exe files in folder.

Usage:
    netsh-rules <absolute path to filename | absolute path to folder> [options]

Options:
    --name    - The rule name (name will be generated if missing name)
    --program - Absolute path to <filename | folder>
    --enable  - Enable rule: yes | no (default: yes)
    --dir     - The rule is inbound or outbound: in | out | both (default: both i.e. in and out)
    --action  - The action for rule: allow | block (default: block)
    --profile - Apply rule for: public | private | domain (default: public, private, domain)
    --format  - Output format can be batch file, powershell, or javascript: bat | ps1 | js (default: ps1)
`;
    //TODO: format - the output format: bat | ps1 | js (default is bat)
    //unix - convert slashes in pathes to Unix format (default true) - does not make sence anymore
    console.log(chalk.gray(msg));

    if (info) {
        console.log(chalk.red(info));
    }

    console.log('');
}

function checkArgs() {
    let args = minimist(process.argv.slice(2), {
        string: ['name', 'action', 'enable', 'dir', 'profile', 'program', 'format'],
        boolean: ['unix'],
        default: {
            name: '__Generated__', // TODO: Add last folder or filename from program
            enable: 'yes',
            action: 'block',
            dir: 'both',
            profile: 'public,private,domain',
            //
            files: [],
            format: 'ps1',
            //unix: true,
        }
    }) as Args;

    !args.program && (args.program = args._[0]);

    checkArg(args.enable, 'enable', ['yes', 'no']);
    checkArg(args.action, 'action', ['allow', 'block']);
    checkArg(args.dir, 'dir', ['in', 'out', 'both']);
    checkArg(args.profile, 'profile', ['public', 'private', 'domain']);
    checkArg(args.format, 'format', ['bat', 'ps1', 'js']);

    //

    if (!args.program) {
        help('No program to process');
        process.exit(1);
    }

    const st = exist(args.program);
    if (!st) {
        help(`Program not found: ${args.program}`);
        process.exit(2);
    }

    if (st.isDirectory()) {
        let files = [];
        collectExeFiles(args.program, files, true);
        args.files = filterDuplicated(files);
    } else {
        args.files.push(args.program);

    }
    //args.files = args.files.map(toWindows); // netsh accepts only back slashes
    args.files = args.files.map(path.normalize); // netsh accepts only back slashes

    args.files.sort((a, b) => a.length - b.length); // shortest first
    
    console.log(chalk.yellow('Found exe files:'));
    console.log(chalk.yellow(`${args.files.map((_) => `    ${_}\n`)}`));

    args.dest = `${uniqueFileName('netsh-rules')}.${args.format}`;

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
    //console.log(chalk.yellow(JSON.stringify(args, null, 4)));

    let content = '';
    switch (args.format) {
        case 'bat': {
            content = genearateBatchFile(args);
            break;
        }
        case 'ps1': {
            content = genearatePowershellFile(args);
            break;
        }
        case 'js': {
            content = genearateJsFile(args);
            break;
        }
    }

    if (connect) {
        fs.writeFileSync(args.dest, content);
    } else {
        console.log(chalk.yellow('Generated nothing'));
    }
} //main()

main();

