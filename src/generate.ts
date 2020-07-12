import path from "path";
import { Args } from ".";
import chalk from "chalk";

const NETSH = 'netsh advfirewall firewall add rule';
// netsh advfirewall firewall show rule name="all"
// netsh advfirewall firewall delete rule "<Rule Name>"
// to verify run wf.msc

function getBase(args: Args) {
    return [
        `enable=${args.enable}`,
        `action=${args.action}`,
        `profile=${args.profile}`
    ].join(' ');
}

function ruleName(fname: string): string {
    fname = path.normalize(fname);
    let parentfolder = path.dirname(fname).split(path.sep).pop().replace(/ /g, '_');
    return `__generated: ${parentfolder}: ${path.basename(fname)}__`;
}

function pushLocation(args: Args, fname: string, name: string, base: string, rv: string[]) {
    if (args.dir === 'both') {
        rv.push(`${NETSH} dir=in  name="${name}" ${base} program="${fname}"`);
        rv.push(`${NETSH} dir=out name="${name}" ${base} program="${fname}"`);
    }
    else {
        rv.push(`${NETSH} dir=${args.dir} name="${name}" ${base} program="${fname}"`);
    }
}

export function genearateBatchFile(args: Args): string {

    let base = getBase(args);

    let lines: string[]  = [];
    args.files.forEach((fname) => {
        let name = ruleName(fname);
        if (args.dir === 'both') {
            lines.push(`rem ${path.basename(fname)}`);
            pushLocation(args, fname, name, base, lines);
            lines.push('');
        } else {
            pushLocation(args, fname, name, base, lines);
        }
    });
    
    lines.forEach((_) => console.log(chalk.yellow(_)));

    return lines.join('\n');
}

export function genearatePowershellFile(args: Args): string {
    let script = 
`
$user = Read-Host "Run script: (Y/n)"

Write-Host "Your choice: '$user'"

$locations = @()

if ($user -eq 'Y' -or $user -eq '') {
    foreach ($location in $locations) {
        "$location"
    }
}
`;

    let base = getBase(args);
    let lines: string[]  = [];
    args.files.forEach((fname) => {
        let name = ruleName(fname);
        pushLocation(args, fname, name, base, lines);
    });
    lines = lines.map(_ => `    ${_}`);
    let fnames = lines.join('\n')

    script = script.replace('$locations = @()', `$locations = @(\n${fnames}\n)`);

    console.log(chalk.yellow(script));

    return script;
}

export function genearateJsFile(args: Args): string {
    let lines: string[]  = [];
    // 'TODO:'
    return lines.join('\n');
}
