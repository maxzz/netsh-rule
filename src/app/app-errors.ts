import { help } from "./app-help";

export function terminate(msg: string, exitCode: number): never {
    help(msg);
    process.exit(exitCode);
}
