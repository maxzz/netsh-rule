import path from "path";
import { Args } from "./app-arguments";

function fnamesToCommands(args: Args) {
    const NETSH = 'netsh advfirewall firewall add rule';
    // netsh advfirewall firewall show rule name="all"
    // netsh advfirewall firewall delete rule "<Rule Name>"
    // to verify run wf.msc
    
    let base = [
        `enable=${args.enable}`,
        `action=${args.action}`,
        `profile=${args.profile}`
    ].join(' ');

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

    function ruleName(fname: string): string {
        let rel = path.relative(args.root, path.dirname(fname));
        if (rel) {
            rel += '\\';
        }
        return `__generated:${args.nameRoot}__${rel}${path.basename(fname)}__`;
    }
}

function genearateBatchFile(args: Args): string {
    const TEMPLATE = 
`rem lines
if %errorlevel% neq 0 pause "Script completed with errors. Did you run as administrator?"
`;

    let lines: string[] = fnamesToCommands(args);
    return TEMPLATE.replace('rem lines', `${lines.join('\n')}`);
}

function genearatePowershellFile(args: Args): string {
    const TEMPLATE = 
`$commands = @()

$user = Read-Host "Run script: (Y/n)"

if ($user -eq 'Y' -or $user -eq '') {
    foreach ($command in $commands) {
        Write-Host "----------------------"
        Write-Host "Creating the new rule:"
        Write-Host $command
        Invoke-Expression $command
    }
} else {
    Write-Host "Your choice: '$user'"
}
`;
	//powershell.exe Set-ExecutionPolicy bypass
	//powershell.exe -File "\netsh-rules 07.11.20 at 22.58.28.215.ps1"
    //powershell.exe Set-ExecutionPolicy restricted
    //TODO: npm package
    //TODO: rules prefix

    let lines: string[] = fnamesToCommands(args);
    lines = lines.map(_ => _ === '' ? _ : _.charAt(0) === '#' ? `    ${_}` : `    '${_}',`); // add indentation and single quotes
    let fnames = lines.join('\n');
    fnames = fnames.replace(/,\n$/, '\n'); // remove the trailing comma

    return TEMPLATE.replace('$commands = @()', `$commands = @(\n${fnames})`);
}

function genearateJsFile(args: Args): string {
    const TEMPLATE = 
`const process = require("child_process");

const commands = [];

for (let command of commands) {
    console.log('----------------------');
    console.log('Creating the new rule:');
    console.log('    ' + command);
    let stdout = process.execSync(command);
    console.log(stdout.toString());
}
`;

    let lines: string[] = fnamesToCommands(args);
    lines = lines.map(_ => _ === '' ? _ : _.match(/^\/\//) ? `    ${_}` : `    '${_}',`); // add indentation and single quotes
    let fnames = lines.join('\n');
    fnames = fnames.replace(/,\n$/, '\n'); // remove the trailing comma

    const locations = [];
    for (let location of locations) {
        console.log(`Run: ${location}`);
    }

    return TEMPLATE.replace('commands = [];', `commands = [\n${fnames}];`);
}

export function genearateFile(args: Args): string {
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
    //console.log(chalk.yellow(content));
    //return;
    return content;
}
