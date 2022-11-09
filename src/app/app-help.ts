import chalk from "chalk";

export function help(info?: string) {
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
