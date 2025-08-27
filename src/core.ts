import fs from 'fs';
import chalk from 'chalk';
import { type Args, checkArgs } from './app/app-arguments';
import { genearateFile } from './app/app-generate';
import { ArgsError, terminate } from './app/app-errors';

export function main() {
    let args: Args;

    try {
        args = checkArgs();
    } catch (e) {
        if (e instanceof ArgsError) {
            terminate(e.message, e.exitCode);
        } else {
            console.log(chalk.red(e.message));
            throw e;
        }
    }

    let content = genearateFile(args);
    if (content) {
        fs.writeFileSync(args.dest, content);
    } else {
        console.log(chalk.yellow('Nothing to generate.'));
    }
}
