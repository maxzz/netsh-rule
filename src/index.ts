import fs from 'fs';
import chalk from 'chalk';
import { checkArgs } from './app/app-arguments';
import { genearateFile } from './app/app-generate';

function main() {
    let args = checkArgs();

    let content = genearateFile(args);
    if (content) {
        fs.writeFileSync(args.dest, content);
    } else {
        console.log(chalk.yellow('Nothing to generate.'));
    }
}

main();
