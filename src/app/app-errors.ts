import { help } from "./app-help";

export function terminate(msg: string, exitCode: number): never {
    help(msg);
    process.exit(exitCode);
}

export class ArgsError extends Error {
    exitCode: number;

    constructor(message: string, exitCode: number) {
        super(message);
        this.name = 'ArgsError';
        this.exitCode = exitCode;
    }
}
