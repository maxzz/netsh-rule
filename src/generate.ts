import path from "path";
import { Args } from ".";
import chalk from "chalk";

function ruleName(fname: string): string {
    fname = path.normalize(fname);
    let parentfolder = path.dirname(fname).split(path.sep).pop().replace(/ /g, '_');
    return `__generated: ${parentfolder}: ${path.basename(fname)}__`;
}

export function genearateBatchFile(args: Args): string {
    // netsh advfirewall firewall show rule name="all"
    // netsh advfirewall firewall delete rule "<Rule Name>"
    // to verify run wf.msc
    const NETSH = 'netsh advfirewall firewall add rule';

    let base = [
        `enable=${args.enable}`,
        `action=${args.action}`,
        `profile=${args.profile}`
    ].join(' ');

    let lines: string[]  = [];
    args.files.forEach((_) => {
        let name = ruleName(_);
        if (args.dir === 'both') {
            lines.push(`rem ${path.basename(_)}`);
            lines.push(`${NETSH} dir=in  name="${name}" ${base} program="${_}"`);
            lines.push(`${NETSH} dir=out name="${name}" ${base} program="${_}"`);
            lines.push('');
        } else {
            lines.push(`${NETSH} dir=${args.dir} name="${name}" ${base} program="${_}"`);
        }
    });
    
    lines.forEach((_) => console.log(chalk.yellow(_)));

    return lines.join('\n');
}

export function genearatePowershellFile(args: Args): string {
    let lines: string[]  = [];
    //console.log(chalk.yellow(JSON.stringify(cmds, null, 4)));
    // 'TODO:'
    return lines.join('\n');
}

export function genearateJsFile(args: Args): string {
    let lines: string[]  = [];
    // 'TODO:'
    return lines.join('\n');
}
