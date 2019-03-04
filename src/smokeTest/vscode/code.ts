/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { tmpName } from 'tmp';
import { ILogger } from '../logger';
import { connect as connectDriver, IDisposable, IDriver, IElement } from './driver';

const repoPath = path.join(__dirname, '../../../..');

function getDevElectronPath(): string {
    const buildPath = path.join(repoPath, '.build');
    const product = require(path.join(repoPath, 'product.json'));

    switch (process.platform) {
        case 'darwin':
            return path.join(buildPath, 'electron', `${product.nameLong}.app`, 'Contents', 'MacOS', 'Electron');
        case 'linux':
            return path.join(buildPath, 'electron', `${product.applicationName}`);
        case 'win32':
            return path.join(buildPath, 'electron', `${product.nameShort}.exe`);
        default:
            throw new Error('Unsupported platform.');
    }
}

function getBuildElectronPath(root: string): string {
    switch (process.platform) {
        case 'darwin':
            return path.join(root, 'Contents', 'MacOS', 'Electron');
        case 'linux': {
            const product = require(path.join(root, 'resources', 'app', 'product.json'));
            return path.join(root, product.applicationName);
        }
        case 'win32': {
            const product = require(path.join(root, 'resources', 'app', 'product.json'));
            return path.join(root, `${product.nameShort}.exe`);
        }
        default:
            throw new Error('Unsupported platform.');
    }
}

function getDevOutPath(): string {
    return path.join(repoPath, 'out');
}

function getBuildOutPath(root: string): string {
    switch (process.platform) {
        case 'darwin':
            return path.join(root, 'Contents', 'Resources', 'app', 'out');
        default:
            return path.join(root, 'resources', 'app', 'out');
    }
}

async function connect(child: cp.ChildProcess, outPath: string, handlePath: string, logger: ILogger): Promise<Code> {
    let errCount = 0;

    // tslint:disable-next-line:no-constant-condition
    while (true) {
        try {
            const { client, driver } = await connectDriver(outPath, handlePath);
            return new Code(client, driver, logger);
        } catch (err) {
            if (++errCount > 50) {
                child.kill();
                throw err;
            }

            // retry
            await new Promise(c => setTimeout(c, 100));
        }
    }
}

// Kill all running instances, when dead
const instances = new Set<cp.ChildProcess>();
process.once('exit', () => instances.forEach(code => code.kill()));

export interface ISpawnOptions {
    codePath?: string;
    workspacePath: string;
    userDataDir: string;
    extensionsPath: string;
    logger: ILogger;
    verbose?: boolean;
    extraArgs?: string[];
    log?: string;
}

async function createDriverHandle(): Promise<string> {
    if ('win32' === os.platform()) {
        // tslint:disable-next-line:insecure-random
        const name = [...Array(15)].map(() => Math.random().toString(36)[3]).join('');
        return `\\\\.\\pipe\\${name}`;
    } else {
        return new Promise<string>((c, e) => tmpName((err, handlePath) => (err ? e(err) : c(handlePath))));
    }
}

export async function spawn(options: ISpawnOptions): Promise<Code> {
    // const codePath = options.codePath;
    // const electronPath = codePath ? getBuildElectronPath(codePath) : getDevElectronPath();
    // const outPath = codePath ? getBuildOutPath(codePath) : getDevOutPath();
    let codePath = options.codePath;
    codePath =
        '/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode/.vscode-test/stable/Visual Studio Code.app';
    // codePath = '/Applications/Visual Studio Code - Insiders.app';
    let electronPath = codePath ? getBuildElectronPath(codePath) : getDevElectronPath();
    // const vscodeAppPath = '/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode/.vscode-test/stable/Visual Studio Code.app';
    electronPath =
        '/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode/.vscode-test/stable/Visual Studio Code.app/Contents/MacOS/Electron';
    // electronPath = '/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Electron';
    const outPath = codePath ? getBuildOutPath(codePath) : getDevOutPath();
    // console.error(`outPath=${outPath}`);

    const handle = await createDriverHandle();
    options.extensionsPath = '/Users/donjayamanne/.vscode-insiders/xx';
    const args = [
        options.workspacePath,
        // '--skip-getting-started',
        // '--skip-release-notes',
        // '--sticky-quickopen',
        // '--disable-telemetry',
        // '--disable-updates',
        // '--disable-crash-reporter',
        `--extensions-dir=${options.extensionsPath}`,
        // '--disable-extensions',
        '--extensionDevelopmentPath=/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode',
        `--user-data-dir=${options.userDataDir}`,
        '--driver',
        handle
    ];

    if (!codePath) {
        args.unshift(repoPath);
    }

    if (options.verbose) {
        args.push('--driver-verbose');
    }

    if (options.log) {
        args.push('--log', options.log);
    }

    if (options.extraArgs) {
        args.push(...options.extraArgs);
    }

    const spawnOptions: cp.SpawnOptions = {};
    console.log(electronPath);
    console.log(args);
    const child = cp.spawn(electronPath, args, spawnOptions);

    instances.add(child);
    child.once('exit', () => instances.delete(child));

    return connect(
        child,
        outPath,
        handle,
        options.logger
    );
}

async function poll<T>(
    fn: () => Thenable<T>,
    acceptFn: (result: T) => boolean,
    timeoutMessage: string,
    retryCount: number = 200,
    retryInterval: number = 100 // millis
): Promise<T> {
    let trial = 1;
    let lastError: string = '';

    while (true) {
        if (trial > retryCount) {
            // console.error('** Timeout!');
            // console.error(lastError);

            throw new Error(`Timeout: ${timeoutMessage} after ${(retryCount * retryInterval) / 1000} seconds.`);
        }

        let result;
        try {
            result = await fn();

            if (acceptFn(result)) {
                return result;
            } else {
                lastError = 'Did not pass accept function';
            }
        } catch (e) {
            lastError = Array.isArray(e.stack) ? e.stack.join(os.EOL) : e.stack;
        }

        await new Promise(resolve => setTimeout(resolve, retryInterval));
        trial += 1;
    }
}

export class Code {
    private _activeWindowId: number | undefined = undefined;
    private driver: IDriver;

    constructor(private client: IDisposable, driver: IDriver, readonly logger: ILogger) {
        this.driver = new Proxy(driver, {
            get(target, prop, receiver) {
                if (typeof prop === 'symbol') {
                    throw new Error('Invalid usage');
                }

                if (typeof target[prop] !== 'function') {
                    return target[prop];
                }

                return function (...args) {
                    logger.log(`${prop}`, ...args.filter(a => typeof a === 'string'));
                    return target[prop].apply(this, args);
                };
            }
        });
    }

    public async capturePage(): Promise<string> {
        const windowId = await this.getActiveWindowId();
        return this.driver.capturePage(windowId);
    }

    public async waitForWindowIds(fn: (windowIds: number[]) => boolean): Promise<void> {
        await poll(() => this.driver.getWindowIds(), fn, `get window ids`);
    }

    public async dispatchKeybinding(keybinding: string): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await this.driver.dispatchKeybinding(windowId, keybinding);
    }

    public async reload(): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await this.driver.reloadWindow(windowId);
    }

    public async exit(): Promise<void> {
        await this.driver.exitApplication();
    }

    public async waitForTextContent(
        selector: string,
        textContent?: string,
        accept?: (result: string) => boolean
    ): Promise<string> {
        const windowId = await this.getActiveWindowId();
        accept = accept || (result => (textContent !== undefined ? textContent === result : !!result));

        return poll(
            () =>
                this.driver
                    .getElements(windowId, selector)
                    .then(els =>
                        els.length > 0
                            ? Promise.resolve(els[0].textContent)
                            : Promise.reject(new Error('Element not found for textContent'))
                    ),
            s => accept!(typeof s === 'string' ? s : ''),
            `get text content '${selector}'`
        );
    }

    public async waitAndClick(selector: string, xoffset?: number, yoffset?: number): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(() => this.driver.click(windowId, selector, xoffset, yoffset), () => true, `click '${selector}'`);
    }

    public async waitAndDoubleClick(selector: string): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(() => this.driver.doubleClick(windowId, selector), () => true, `double click '${selector}'`);
    }

    public async waitForSetValue(selector: string, value: string): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(() => this.driver.setValue(windowId, selector, value), () => true, `set value '${selector}'`);
    }

    public async waitForElements(
        selector: string,
        recursive: boolean,
        accept: (result: IElement[]) => boolean = result => result.length > 0,
        retryCount: number = 200,
        retryInterval: number = 100 // millis
    ): Promise<IElement[]> {
        const windowId = await this.getActiveWindowId();
        return await poll(
            () => this.driver.getElements(windowId, selector, recursive),
            accept,
            `get elements '${selector}'`,
            retryCount,
            retryInterval
        );
    }

    public async waitForElement(
        selector: string,
        accept: (result: IElement | undefined) => boolean = result => !!result,
        retryCount: number = 200,
        retryInterval: number = 100 // millis
    ): Promise<IElement> {
        const windowId = await this.getActiveWindowId();
        return await poll<IElement>(
            () => this.driver.getElements(windowId, selector).then(els => els[0]),
            accept,
            `get element '${selector}'`,
            retryCount,
            retryInterval
        );
    }

    public async waitForActiveElement(selector: string, retryCount: number = 200): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(
            () => this.driver.isActiveElement(windowId, selector),
            r => r,
            `is active element '${selector}'`,
            retryCount
        );
    }

    public async waitForTitle(fn: (title: string) => boolean): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(() => this.driver.getTitle(windowId), fn, `get title`);
    }

    public async waitForTypeInEditor(selector: string, text: string): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(
            () => this.driver.typeInEditor(windowId, selector, text),
            () => true,
            `type in editor '${selector}'`
        );
    }

    public async waitForTerminalBuffer(selector: string, accept: (result: string[]) => boolean): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(
            () => this.driver.getTerminalBuffer(windowId, selector),
            accept,
            `get terminal buffer '${selector}'`
        );
    }

    public async writeInTerminal(selector: string, value: string): Promise<void> {
        const windowId = await this.getActiveWindowId();
        await poll(
            () => this.driver.writeInTerminal(windowId, selector, value),
            () => true,
            `writeInTerminal '${selector}'`
        );
    }

    public dispose(): void {
        this.client.dispose();
    }
    private async getActiveWindowId(): Promise<number> {
        if (typeof this._activeWindowId !== 'number') {
            const windows = await this.driver.getWindowIds();
            this._activeWindowId = windows[0];
        }

        return this._activeWindowId;
    }
}

export function findElement(element: IElement, fn: (element: IElement) => boolean): IElement | null {
    const queue = [element];

    while (queue.length > 0) {
        const ele = queue.shift()!;

        if (fn(ele)) {
            return ele;
        }

        queue.push(...ele.children);
    }

    return null;
}

export function findElements(element: IElement, fn: (element: IElement) => boolean): IElement[] {
    const result: IElement[] = [];
    const queue = [element];

    while (queue.length > 0) {
        const ele = queue.shift()!;

        if (fn(ele)) {
            result.push(ele);
        }

        queue.push(...ele.children);
    }

    return result;
}
