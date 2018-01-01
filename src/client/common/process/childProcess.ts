import * as child_process from 'child_process';
import { injectable } from 'inversify';
import { IChildProcess } from './types';

@injectable()
export class ChildProcess implements IChildProcess {
    public spawn(command: string, args: string[], options: child_process.SpawnOptions): child_process.ChildProcess {
        return child_process.spawn(command, args, options);
    }
}
