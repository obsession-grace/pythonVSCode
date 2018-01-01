import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import { ICurrentProcess, Is64Bit, IsWindows } from '../types';
import { IWslUtils } from './types';

@injectable()
export class WslUtils implements IWslUtils {
    private _isSupported: boolean;
    private _bashExecutablePath: string;
    constructor( @inject(Is64Bit) private is64Bit: boolean,
        @inject(IsWindows) private isWindows: boolean,
        @inject(ICurrentProcess) private currentProcess: ICurrentProcess) { }

    public get isSupported(): boolean {
        if (typeof this._isSupported === 'boolean') {
            return this._isSupported;
        }
        if (!this.isWindows) {
            return this._isSupported = false;
        }
        return this._isSupported = fs.pathExistsSync(this.bashExecutablePath);
    }
    public get bashExecutablePath(): string {
        if (typeof this._bashExecutablePath === 'string') {
            return this._bashExecutablePath;
        }
        return this._bashExecutablePath = path.join(this.currentProcess.env.SystemRoot, (this.is64Bit ? 'System32' : 'Sysnative'), 'bash.exe');
    }
    public translateToWslPath(windowsPath: string): string {
        if (typeof windowsPath !== 'string' || windowsPath.trim().length === 0) {
            return windowsPath;
        }
        if (path.isAbsolute(windowsPath)) {
            return `/mnt/${windowsPath.substr(0, 1).toLowerCase()}/${windowsPath.substr(3).replace(/\\/g, '/')}`;
        }
        return windowsPath.replace(/\\/g, '/');
    }
    public translateToWindowsPath(wslPath: string): string {
        if (typeof wslPath !== 'string' || wslPath.trim().length === 0) {
            return wslPath;
        }
        if (wslPath.startsWith('/mnt/')) {
            const pathWithoutMntPrefix = wslPath.substring('/mnt/'.length);
            const driveLetter = pathWithoutMntPrefix.split('/', 2).shift()!;
            if (driveLetter.length === 1) {
                return `${driveLetter}:\\${pathWithoutMntPrefix.substring(2).split('/').join('\\')}`;
            }
            return pathWithoutMntPrefix;
        }
        return wslPath.split('/').join('\\');
    }

}
