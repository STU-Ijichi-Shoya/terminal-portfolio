import { stdin } from "process";
import { commands } from "../interpriter/commands";

type StdOut = (arg0: string) => void;
type StdIn = () => string;
type StdErr = (arg0: string) => void;


type FileType = "file" | "directory" | "link" | "unknown" | "executable";


class File{
    permission:number=0o777;
    name:string= "I am File";
    type:FileType="file";
    content:any=undefined;
    owner:string="root-shoya❤";
    constructor(name:string,permission:number=0o777,content:any=undefined,owner:string="root-shoya❤"){
        this.name=name;
        this.permission=permission;
        this.content=content;
        this.owner=owner;
    }
}

class ExecutableFile extends File{
    type:FileType="executable";
    exe=(stdin:StdIn,stdout:StdOut,stderr:StdErr,command:string[]):void=>{
        this.content(stdin,stdout,stderr,command);
    };
}

interface Device{
    readAllFilePath(): any[];
    name:string;
    write:(path:Path,content:any)=>void;
    read:(path:Path)=>any;
    delete:(path:Path)=>void;
    clear:()=>void;
}

class HashDevice implements Device{
    name:string="HashDevice";
    content:Map<string,any>=new Map();
    readAllFilePath(): string[] {
        return Array.from(this.content.keys());
    }
    write(path: Path,content:any): void {
        this.content.set(path.toString(),content);
    }
    read(path: Path): any {
        return this.content.get(path.toString());
    }
    delete(path: Path): void {
        this.content.delete(path.toString());
    }
    clear(): void {
        this.content.clear();
    }
}


class LocalStorageDevice implements Device{
    write(path: Path, content: any){
         localStorage.setItem(path,content);
    }
    read(path: Path){
        console.log('read:'+path);
        return localStorage.getItem('/usr/bin/echo');
    }
    delete(path: Path){
        localStorage.removeItem(path);
    }

    name='localStorage';
    
    readAllFilePath(){
        let result:string[]=[];
        for(let key in localStorage){
            result.push(key);
        }
        return result;
    }
    clear(){
        localStorage.clear();
    }
}

type FILE = string;

class Dirctory implements File{
    name:string;
    type:FileType='directory';
    content:(File|Dirctory) []=[];
    owner:string="root-shoya❤";

    constructor(name:string,permission:number=0o000,owner:string="root-shoya❤"){
        this.name=name;
        this.permission=permission;
        this.owner=owner;
    }
    permission: number=0;
    addFile(file:File|Dirctory){
        this.content.push(file);
        return this;
    }
}

type Path=string;

class filesystem{
    private static instance: filesystem;

    private Device:Device=new HashDevice();
    
    public static parsePath(path:string){
        if(path=='/'){
            return ['']
        }
        return path.split('/')
    }
    public static absPath(refPath:string,relativePath:string){
        if(refPath.charAt(0)!='/'){
            throw Error('refPathが誤り')
        }
        const relativePathArray=relativePath.split('/');

        let stack:string[]=[];
        //相対パスの場合は，カレントディレクリから絶対位置を知る必要がある
        if(relativePath[0]!='/'){
            if(refPath=='/')
                stack=[''];// '/'.split()===['','']になるため 
            else{
                stack=refPath.split('/');
            }
        }//絶対パスの場合は，知る必要がなく，..と.を正規化するだけでよい．
        relativePathArray.forEach(
            (v)=>{
                if(v=='..'){
                    stack.pop();
                }else if(v=='.'||v==''){
                    //pass
                }else{
                    stack.push(v);
                }
            }
        )
       
        let r=stack.join('/');
       
        if(r.charAt(0)!='/'){
            r='/'+r;
        
        }

        return r;
        
    }

    private constructor() { }

    public init(){

        const rootDir=new Dirctory('/');
        const usr_bin=new Dirctory('bin');

        usr_bin.addFile(new ExecutableFile('ls',0o777,commands.ls));
        usr_bin.addFile(new ExecutableFile('echo',0o777,commands.echo));
        usr_bin.addFile(new ExecutableFile('cat',0o777,commands.cat));
        
        const guest_dir=new Dirctory('guest').addFile(new File('about.txt',0o666,'こんにちは')).addFile(new File('WTF.txt',0o666,'Hello')).addFile(new File('.secret😇.txt',0o666,'this is secret file'))

        rootDir.addFile(new Dirctory('home').addFile(guest_dir)); // /home/you
        rootDir.addFile(new Dirctory('usr').addFile(usr_bin)); // /usr/bin ここに組み込みコマンドを入れる
        rootDir.addFile(new Dirctory('bin'));
        rootDir.addFile(new Dirctory('etc'));
        rootDir.addFile(new Dirctory('var'));
        rootDir.addFile(new Dirctory('tmp'));
        rootDir.addFile(new Dirctory('dev').addFile(new Dirctory('local_storage')));
        rootDir.addFile(new Dirctory('proc'));
        rootDir.addFile(new Dirctory('sys'));

        this.root=rootDir;

        this.Device.clear();
        this.Device.write('filemap',rootDir);
        
        function recursive(pname:string,dir:Dirctory|File,Device:Device){
            const n=(pname+'/'+dir.name).replace('///','/').replace('//','/');
            Device.write(n,dir);
            
            if(dir.type==='directory'){
                for(let file of dir.content){
                    const n=(pname+'/'+dir.name).replace('///','/')
                    recursive(n,file,Device);
                }
            };
        }
        recursive('',rootDir,this.Device);
        console.log('filemap'+this.Device.readAllFilePath());

    }

    public static getInstance(): filesystem {
        if (!filesystem.instance) {
            filesystem.instance = new filesystem();
            filesystem.instance.init();
            console.log('called');
        }
        return filesystem.instance;
    }
    private root:Dirctory|null=null;

    public read(path:Path):Dirctory|File|undefined|ExecutableFile{
        return this.Device.read(path);
    }

    public readAllFilePath():any[]{
        return this.Device.readAllFilePath();
    }
    public write(path:Path,file:File){
        this.Device.write(path,file);
    }
    public delete(path:Path){
        this.Device.delete(path);
    }
    public getRoot():(Dirctory|null){
        return this.root;
    }

    public pipe(){

    }
    public dup(){

    }

    public std_write(fid:FILE,content:any){

    }

    public std_get(fid:FILE){

    }

    public std_close(fid:FILE){

    }

    public std_open(fid:FILE){

    }

    private manageFIDMap=new Map<FILE,string>;
    
}

export type {StdIn,StdErr,StdOut};
export {filesystem,File,Dirctory,ExecutableFile};