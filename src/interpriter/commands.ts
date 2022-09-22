import { cwd } from 'process';
import {StdIn,StdErr,StdOut, filesystem, Dirctory, File,} from '../filesystem/std'


// args [cwd,...args]
function Ls(stdin:StdIn,stdout:StdOut,stderr:StdErr,command:string[]){
    let dirPath=command[0];
    const cwd=command[0];

    let allfileOption=false;
    let detailOption=false;

    for(let i=1;i<command.length;i++){
       switch (command[i]) {
        case '-a':
        case '--all':
            allfileOption=true;
            break;
        case '-l':
            detailOption=true;
            break;
        case '--help':
            stdout(' ls [OPTION]... [FILE]...')
            stdout(' List information about the FILEs (the current directory by default).')
            stdout(' -a, --all: do not ignore entries starting with .')
            stdout(' -l: use a long listing format')
            stdout('--help: display this help and exit')
            return
        default:
            if(command[i][0]=='-'){
                stderr(' ls: invalid option '+command[i].slice(1));
                stderr(' Try \'ls --help\' for more information.');
                return
            }
            dirPath=command[i];
            break;
       }
    }
    const absDirPath=filesystem.absPath(cwd,dirPath);
    const dir=filesystem.getInstance().read(absDirPath);

    if(dir instanceof Dirctory){
        let files=dir.content;
        if(!allfileOption){
            files=files.filter(f=>f.name.charAt(0)!='.')
        }
        if(detailOption){
            const filenum=files.length;
            files.forEach((file)=>{
                const permissionBit=('000000000'+file.permission.toString(2)).slice(-9);
                console.log(file.permission.toString(2));
                let bit:string='rwxrwxrwx'.split('').map((bit,idx)=>{return permissionBit.charAt(idx)=='1'?bit:'-'}).join('');

                switch(file.type){
                    case 'directory':
                        bit='d'+bit;
                        break;
                    case 'link':
                        bit='l'+bit;
                        break;
                    default:
                        bit='-'+bit;
                        break;
                }

                const owner=file.owner;
                const group=file.owner;
                const size=JSON.stringify(file).length;
                const currentDate=new Date();
                const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const date=`${months[currentDate.getMonth()]} ${currentDate.getDate()}`;

                const name=file.name;
                stdout(`${bit} ${owner} ${group} ${size} ${date} ${name}`)
            })
        }else{
            stdout(files.map((f)=>f.name).join('  '));
        }
    }else if(dir instanceof File){
        stdout(dir.name);
    }
    else{
        stderr('ls: cannot access '+dirPath+': No such file or directory')
    }
}

function echo(stdin:StdIn,stdout:StdOut,stderr:StdErr,command:string[]){
    console.log('log->'+command);
    stdout(command.slice(1).join(' '));
}

function cat(stdin:StdIn,stdout:StdOut,stderr:StdErr,command:string[]){
    let show_all=false;
    let show_number=false;
    let files:string[]=[];
    for(let arg of command.slice(1)){
        switch(arg){
            case '-A':
            case '--show-all':
                show_all=true;
                break
            case '-n':
            case '--number':
                show_number=true;
                break
            case '--help':
                stdout('Usage: cat [OPTION]... [FILE]...');
                stdout('Concatenate FILE(s) to standard output.')
                stdout('');
                stdout('    -A, --show-all           equivalent to -vET')
                stdout('    -n, --number             number all output lines')
                return
            default:
                if(arg.charAt(0)=='-'){
                    stderr(' cat: invalid option '+arg);
                    stderr(' Try \'cat --help\' for more information.');
                    return
                }
                files.push(arg);
        }
    }
    let numberCount=0;
    for(let fileRefpath of files){
        let filepath=filesystem.absPath(command[0],fileRefpath);
        let file=filesystem.getInstance().read(filepath);
        if(!!file && file.type!='directory'){
            let out=`${file.content}`;
            if(show_number)
                out=`\t${++numberCount} ${out}`;
            if(show_all){
                out+='$';
            }
            stdout(out);
        }
        else{
            stderr(`cat: ${fileRefpath}: No such file or directory`)
        }
    }
}

export const commands={
    ls:Ls,
    echo:echo,
    cat:cat
}