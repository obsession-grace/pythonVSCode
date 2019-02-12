/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import { Workbench } from './areas/workbench/workbench';
import { Code, spawn, SpawnOptions } from './vscode/code';
import { Logger } from './logger';
import { Configuration, getConfiguration, Enviroment } from './setup/config';
import { noop } from './helpers';

export const enum Quality {
    Dev,
    Insiders,
    Stable
}

export interface ApplicationOptions extends SpawnOptions {
    quality: Quality;
    workspacePath: string;
    waitTime: number;
    screenshotsPath: string | null;
}

export class Application {

    private _code: Code | undefined;
    private _workbench: Workbench;
    private _config: Configuration;
    private _workspacePathOrFolder: string;

    private _screenshotHook: (buffer: Buffer) => void;
    constructor(private options: ApplicationOptions) {
        this._workspacePathOrFolder = options.workspacePath;
    }
    public activeEnvironment: Enviroment;
    public get isJedi(): boolean {
        return this.activeEnvironment.settings['python.jediEnabled'];
    }

    public get quality(): Quality {
        return this.options.quality;
    }

    public get configuration(): Configuration {
        return this._config;
    }

    public get code(): Code {
        return this._code!;
    }

    public get workbench(): Workbench {
        return this._workbench;
    }

    public get logger(): Logger {
        return this.options.logger;
    }

    public get workspacePathOrFolder(): string {
        return this._workspacePathOrFolder;
    }

    public get extensionsPath(): string {
        return this.options.extensionsPath;
    }

    public get userDataPath(): string {
        return this.options.userDataDir;
    }

    public async start(): Promise<any> {
        this._config = getConfiguration();
        await this._start();
        await this.code.waitForElement('.explorer-folders-view');
        await this.code.waitForActiveElement(`.editor-instance[id="workbench.editor.walkThroughPart"] > div > div[tabIndex="0"]`);
    }

    public async restart(options: { workspaceOrFolder?: string, extraArgs?: string[] }): Promise<any> {
        await this.stop();
        await new Promise(c => setTimeout(c, 1000));
        await this._start(options.workspaceOrFolder, options.extraArgs);
    }

    public async reload(): Promise<any> {
        this.code.reload()
            .catch(err => null); // ignore the connection drop errors

        // needs to be enough to propagate the 'Reload Window' command
        await new Promise(c => setTimeout(c, 1500));
        await this.checkWindowReady();
    }

    public async stop(): Promise<any> {
        if (this._code) {
            await this._code.exit();
            this._code.dispose();
            this._code = undefined;
        }
    }
    public registerScreenshotHook(hook: (buffer: Buffer) => void) {
        this._screenshotHook = hook;
    }
    public async captureScreenshot(name: string): Promise<void> {
        if (!this.options.screenshotsPath) {
            return;
        }
        const raw = await this.code.capturePage();
        const buffer = Buffer.from(raw, 'base64');
        const screenshotPath = path.join(this.options.screenshotsPath, `${name}.png`);
        if (this.options.log) {
            this.logger.log('*** Screenshot recorded:', screenshotPath);
        }
        fs.writeFileSync(screenshotPath, buffer);
        (this._screenshotHook || noop)(buffer);
    }
    private async _start(workspaceOrFolder = this.workspacePathOrFolder, extraArgs: string[] = []): Promise<any> {
        this._workspacePathOrFolder = workspaceOrFolder;
        await this.startApplication(extraArgs);
        await this.checkWindowReady();
    }

    private async startApplication(extraArgs: string[] = []): Promise<any> {
        this._code = await spawn({
            codePath: this.options.codePath,
            workspacePath: this.workspacePathOrFolder,
            userDataDir: this.options.userDataDir,
            extensionsPath: this.options.extensionsPath,
            logger: this.options.logger,
            verbose: this.options.verbose,
            log: this.options.log,
            extraArgs,
        });

        this._workbench = new Workbench(this._code, this.userDataPath);
    }

    private async checkWindowReady(): Promise<any> {
        if (!this.code) {
            console.error('No code instance found');
            return;
        }

        await this.code.waitForWindowIds(ids => ids.length > 0);
        await this.code.waitForElement('.monaco-workbench');

        // wait a bit, since focus might be stolen off widgets
        // as soon as they open (eg quick open)
        await new Promise(c => setTimeout(c, 500));
    }
}
