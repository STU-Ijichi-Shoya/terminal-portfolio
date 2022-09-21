import { throws } from 'assert';
import { StdIn, StdOut, StdErr, filesystem, ExecutableFile } from '../filesystem/std'

interface Command {
    name: string;
    args: string[];
    usage: string;
}







class BashInterPriter {
    private static instance: BashInterPriter;

    private stdout: StdOut = console.log;
    private stdin: StdIn = () => { return "" };
    private stderr: StdErr = console.error;

    private EnvVar: Map<string, string> = new Map<string, string>();
    private BuiltInCommand: Map<string, any> = new Map<string, any>();

    private currentDir: string = '/home/guest';
    private filesys: filesystem = filesystem.getInstance();

    private constructor(stdin: StdIn, stdout: StdOut, stderr: StdErr) {
        this.currentDir = '/home/guest';
        this.stdin = stdin;
        this.stdout = stdout;
        this.stderr = stderr;
    }
    public getCwd(): string {
        return this.currentDir.replace('/home/guest', '~');
    }

    public getCurentUser(): string {
        return 'guest';
    }
    public static getInstance(stdin: StdIn, stdout: StdOut, stderr: StdErr): BashInterPriter {
        if (!BashInterPriter.instance) {
            BashInterPriter.instance = new BashInterPriter(stdin, stdout, stderr);
        }
        BashInterPriter.instance.init();
        return BashInterPriter.instance;
    }

    public init() {
        this.BuiltInCommand.set('cd', this.Cd);
        this.BuiltInCommand.set('which', this.Which);

        this.EnvVar.set('PATH', '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin');
    }
    /*
    Bash := *cmd* | *cmd* '|' Bash ;
    cmd := command space args | space command | command
    args := arg space args | arg
    arg := string | number | boolean
    */
    public run(command: string): void {
        const parsed = this.Parse(command);
        this.Bash(parsed);
    }

    public Parse(command: string): string[] {
        let result: string[] = [];
        //空白を除く
        command.split(' ').forEach((command: string) => {
            let ret = ''
            for (let i = 0; i < command.length; i++) {

                if (command[i] == ' ') {
                    continue
                }
                else {
                    ret += command[i]
                }
            }
            if(ret.length)
                result.push(ret)
        });
        return result;
    }

    public Bash(command: string[]): void {
        if (command.some((command: string) => command == '|')) { return this.stderr('Pipe is Not Impremented') }

        // console.log(command);

        return this.cmd(command);
    }
    public cmd(command: string[]): void {
        console.log(command)
        const args = command;
        const cmdName = command[0];

        if (this.BuiltInCommand.has(cmdName)) {
            this.BuiltInCommand.get(cmdName)(args);
            return;
        }

        command[0] = this.currentDir;

        if (this.EnvVar == undefined) {
            this.stderr('EnvVar is undefined');
            return
        }
        const searchPaths = this.EnvVar?.get('PATH');
        if (searchPaths == undefined) {
            this.stderr('PATH is undefined');
            return
        }
        // console.log(this.filesys.readAllFilePath());
        const paths = searchPaths.split(':');
        for (let path of paths) {
            console.log('search:' + path + '/' + cmdName);
            const file = this.filesys.read(path + '/' + cmdName);
            if (!!file && file.type == 'executable') {
                const f = file as ExecutableFile;
                console.log(args)
                try {
                    f.exe(this.stdin, this.stdout, this.stderr, args);

                } catch {
                    this.stderr('Error Occured');

                }

                // eval(f.content);
                // console.log(f.content);
                return
            }



        }

        this.stderr('Command Not Found');

    }

    private Cd(command: string[]) {
        const targetPathDir = command.length == 0 ? '/home/guest' : command[0];
        const absDirPath = filesystem.absPath(this.currentDir, targetPathDir);
        const dir = this.filesys.read(absDirPath);
        if (!!dir && dir.type == 'directory') {
            console.log(dir)
            this.currentDir = absDirPath;
            return
        }

        this.stderr('No Such Directory');

    }

    private Which(command: string[]) {
        const cmdName = command[0];
        const searchPaths = this.EnvVar?.get('PATH');
        if (searchPaths == undefined) {
            this.stderr('PATH is undefined');
            return
        }
        const paths = searchPaths.split(':');
        for (let path of paths) {
            const file = this.filesys.read(path + '/' + cmdName);
            if (!!file && file.type == 'executable') {
                this.stdout(path + '/' + cmdName);
                return
            }
        }
    }
}

export { BashInterPriter };