import { throws } from 'assert';
import { StdIn, StdOut, StdErr, filesystem, ExecutableFile } from '../filesystem/std'

interface Command {
    name: string;
    args: string[];
    usage: string;
}







class BashInterPriter {
    public static instance: BashInterPriter;

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
        this.BuiltInCommand.set('help',this.help);
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

    public TabComplete(command:string){
        const parsed=this.Parse(command);
        const curdir=this.currentDir;
        const target=parsed.at(-1);
        if(target==undefined){
            return command;
        }
        let spath=true;
        //tab補完
        if(spath){
            let absDirPath = filesystem.absPath(curdir, target);
            let parsedPath= filesystem.parsePath(absDirPath);

            // ディレクトリ
            if(absDirPath.at(-1)=='/'){
                absDirPath=absDirPath.slice(0,-1);
                const dir = filesystem.getInstance().read(absDirPath);
                if (!!dir && dir.type == 'directory') {
                   return command;
                }
            }
            // ファイル
            const dir = filesystem.getInstance().read(absDirPath);
            if (!!dir && dir.type == 'directory') {
                // console.log();
                return absDirPath;
            }
        }

    }

    public help(){
        const ins=BashInterPriter.instance;
        ins.stdout('===Built in commands===')
        ins.BuiltInCommand.forEach((v,k)=>{
            ins.stdout(k);
        })
        ins.stdout('========================')
        ins.stdout("And Let's check /usr/bin or /bin ")
        ins.stdout('You can use Tab Complete!😁')
        ins.stdout('Enjoy!!👍👍')
    }

    public Parse(command: string): string[] {
        let result: string[] = [];
        //空白を除く
        command.split(' ').forEach((command: string) => {
            let ret = ''
            for (let i = 0; i < command.length; i++) {

                if (command[i] == ' '||command[i]=='\t') {
                    continue
                }
                else {
                    ret += command[i]
                }
            }
            if(ret.length)
                result.push(ret)
        });
        // let stack:string[]=[]
        // let isString=false;
        // let s='';
        // for(let c of command){
        //     if(c==' '){
        //         result.push(s);
        //         s='';
        //         continue
        //     }else if('\''){
        //         if (stack.at(-1)=='\''){
        //             stack.pop()
        //             result.push(s)
        //         }else{
        //             stack.push(c)
        //         }
        //     }else if('\"'){
        //         if (stack.at(-1)=='\"'){
        //             stack.pop()
        //             result.push(s)
        //         }else{
        //             stack.push(c)
        //         }
        //     }else if(c=='|'){
        //         if(stack.length==0){
        //             result.push(c)
        //         }
        //     }else{
        //         s+=c
        //     }

        // }
        return result;
    }

    public Bash(command: string[]): void {
        if (command.some((command: string) => command == '|')) { return this.stderr('Pipe is Not Impremented') }

        // console.log(command);

        return this.cmd(command);
    }
    public cmd(command: string[]): void {
        const cmdName = command[0];

        command[0] = this.currentDir;

        const args = command;

        if (this.BuiltInCommand.has(cmdName)) {
            const cmd=this.BuiltInCommand.get(cmdName)
            cmd(args);
            return;
        }


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

    public Cd(command: string[]):void {
        // console.log('this'+this);
        const interPriter=BashInterPriter.instance;
        const curdir=command[0];
        const targetPathDir = command.length == 1 ? '/home/'+interPriter.getCurentUser() : command[1];

        console.log(targetPathDir);

        const absDirPath = filesystem.absPath(curdir, targetPathDir);
        console.log(targetPathDir+' '+ curdir+' '+absDirPath);
        const dir = filesystem.getInstance().read(absDirPath);
        if (!!dir && dir.type == 'directory') {
            // console.log();
            interPriter.currentDir = absDirPath;
            return
        }

        interPriter.stderr('No Such Directory');

    }

    private Which(command: string[]) {
        const interPriter=BashInterPriter.instance;

        if(command.length<2){
            interPriter.stderr('err');
            return;
        }
        const cmdName = command[1];
        const searchPaths = interPriter.EnvVar?.get('PATH');
        if (searchPaths == undefined) {
            this.stderr('PATH is undefined');
            return
        }
        const paths = searchPaths.split(':');
        for (let path of paths) {
            const file = filesystem.getInstance().read(path + '/' + cmdName);
            if (!!file && file.type == 'executable') {
                interPriter.stdout(path + '/' + cmdName);
                return
            }
        }
    }
}

export { BashInterPriter };