import path from "path";
import { Args } from ".";
import chalk from "chalk";

const NETSH = 'netsh advfirewall firewall add rule';
// netsh advfirewall firewall show rule name="all"
// netsh advfirewall firewall delete rule "<Rule Name>"
// to verify run wf.msc

function linesToArray(args: Args) {
    let base = getBase(args);
    let comment = args.format === 'bat' ? 'rem' : args.format === 'ps1' ? '#' : args.format === 'js' ? '//' : '???';
    
    let lines: string[] = [];

    args.files.forEach((fname) => {
        let name = ruleName(fname);
        if (args.dir === 'both') {
            lines.push(`${comment} ${path.basename(fname)}`);
            lines.push(`${NETSH} dir=in  name="${name}" ${base} program="${fname}"`);
            lines.push(`${NETSH} dir=out name="${name}" ${base} program="${fname}"`);
            lines.push('');
        }
        else {
            lines.push(`${NETSH} dir=${args.dir} name="${name}" ${base} program="${fname}"`);
        }
    });

    return lines;

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
}

export function genearateBatchFile(args: Args): string {
    let lines: string[] = linesToArray(args);
    
    lines.forEach((_) => console.log(chalk.yellow(_)));

    return lines.join('\n');
}

export function genearatePowershellFile(args: Args): string {
    let script = 
`$locations = @()

$user = Read-Host "Run script: (Y/n)"

if ($user -eq 'Y' -or $user -eq '') {
    foreach ($location in $locations) {
        Write-Host "----------------------"
        Write-Host "Creating the new rule:"
        Write-Host $location
        Invoke-Expression $location
    }
} else {
    Write-Host "Your choice: '$user'"
}
`;

    let lines: string[] = linesToArray(args);
    lines = lines.map(_ => _ === '' ? _ : _.charAt(0) === '#' ? `    ${_}` : `    '${_}'`); // add indentation and single quotes
    let fnames = lines.join('\n');

    script = script.replace('$locations = @()', `$locations = @(\n${fnames})`);

    console.log(chalk.yellow(script));

    return script;
}

export function genearateJsFile(args: Args): string {
    let lines: string[]  = [];
    // 'TODO:'
    return lines.join('\n');
}
