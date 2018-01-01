import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';
import { IPathUtils, IsWindows } from '../types';
import { NON_WINDOWS_PATH_VARIABLE_NAME, WINDOWS_PATH_VARIABLE_NAME } from './constants';

@injectable()
export class PathUtils implements IPathUtils {
    constructor( @inject(IsWindows) private isWindows: boolean) { }
    public getPathVariableName() {
        return this.isWindows ? WINDOWS_PATH_VARIABLE_NAME : NON_WINDOWS_PATH_VARIABLE_NAME;
    }
    public async fileExists(fileName: string): Promise<boolean> {
        if (typeof fileName !== 'string' || fileName.trim().length === 0) {
            return false;
        }
        const exists = await fs.pathExists(fileName);
        if (exists) {
            return new Promise<boolean>(resolve => fs.lstat(fileName, (err, stats) => resolve(err ? false : stats.isFile())));
        } else {
            return false;
        }
    }
    public async pathExists(pathName: string): Promise<boolean> {
        if (typeof pathName !== 'string' || pathName.trim().length === 0) {
            return false;
        }
        const exists = await fs.pathExists(pathName);
        if (exists) {
            return new Promise<boolean>(resolve => fs.lstat(pathName, (err, stats) => resolve(err ? false : stats.isDirectory())));
        } else {
            return false;
        }
    }
}
