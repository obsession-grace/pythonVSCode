// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import * as Rx from 'rxjs';
import { Disposable } from 'vscode';
import { createDeferred } from '../helpers';
import { DEFAULT_ENCODING } from './constants';
import { ExecutionResult, IBufferDecoder, IChildProcess, IProcessService, IWslUtils, ObservableExecutionResult, Output, SpawnOptions, StdErrError } from './types';

@injectable()
export class WslProcessService implements IProcessService {
    constructor( @inject(IBufferDecoder) private decoder: IBufferDecoder,
        @inject(IWslUtils) private wslUtils: IWslUtils,
        @inject(IChildProcess) private childProcess: IChildProcess) { }
    public execObservable(file: string, args: string[], options: SpawnOptions = {}): ObservableExecutionResult<string> {
        const encoding = options.encoding = typeof options.encoding === 'string' && options.encoding.length > 0 ? options.encoding : DEFAULT_ENCODING;
        delete options.encoding;
        const spawnOptions = { ...options };
        if (!spawnOptions.env || Object.keys(spawnOptions).length === 0) {
            spawnOptions.env = { ...process.env };
        }

        // Always ensure we have unbuffered output.
        spawnOptions.env.PYTHONUNBUFFERED = '1';
        if (!spawnOptions.env.PYTHONIOENCODING) {
            spawnOptions.env.PYTHONIOENCODING = 'utf-8';
        }

        const proc = this.spawn(file, args, spawnOptions);
        let procExited = false;

        const output = new Rx.Observable<Output<string>>(subscriber => {
            const disposables: Disposable[] = [];

            const on = (ee: NodeJS.EventEmitter, name: string, fn: Function) => {
                ee.on(name, fn);
                disposables.push({ dispose: () => ee.removeListener(name, fn) });
            };

            if (options.token) {
                disposables.push(options.token.onCancellationRequested(() => {
                    if (!procExited && !proc.killed) {
                        proc.kill();
                        procExited = true;
                    }
                }));
            }

            const sendOutput = (source: 'stdout' | 'stderr', data: Buffer) => {
                const out = this.decoder.decode([data], encoding);
                if (source === 'stderr' && options.throwOnStdErr) {
                    subscriber.error(new StdErrError(out));
                } else {
                    subscriber.next({ source, out: out });
                }
            };

            on(proc.stdout, 'data', (data: Buffer) => sendOutput('stdout', data));
            on(proc.stderr, 'data', (data: Buffer) => sendOutput('stderr', data));

            proc.once('close', () => {
                procExited = true;
                subscriber.complete();
                disposables.forEach(disposable => disposable.dispose());
            });
            proc.once('error', ex => {
                procExited = true;
                subscriber.error(ex);
                disposables.forEach(disposable => disposable.dispose());
            });
        });

        return { proc, out: output };
    }
    public async exec(file: string, args: string[], options: SpawnOptions = {}): Promise<ExecutionResult<string>> {
        const encoding = options.encoding = typeof options.encoding === 'string' && options.encoding.length > 0 ? options.encoding : DEFAULT_ENCODING;
        delete options.encoding;
        const spawnOptions = { ...options };
        if (!spawnOptions.env || Object.keys(spawnOptions).length === 0) {
            spawnOptions.env = { ...process.env };
        }

        // Always ensure we have unbuffered output.
        spawnOptions.env.PYTHONUNBUFFERED = '1';
        if (!spawnOptions.env.PYTHONIOENCODING) {
            spawnOptions.env.PYTHONIOENCODING = 'utf-8';
        }
        const proc = this.spawn(file, args, spawnOptions);
        const deferred = createDeferred<ExecutionResult<string>>();
        const disposables: Disposable[] = [];

        const on = (ee: NodeJS.EventEmitter, name: string, fn: Function) => {
            ee.on(name, fn);
            disposables.push({ dispose: () => ee.removeListener(name, fn) });
        };

        if (options.token) {
            disposables.push(options.token.onCancellationRequested(() => {
                if (!proc.killed && !deferred.completed) {
                    proc.kill();
                }
            }));
        }

        const stdoutBuffers: Buffer[] = [];
        on(proc.stdout, 'data', (data: Buffer) => stdoutBuffers.push(data));
        const stderrBuffers: Buffer[] = [];
        on(proc.stderr, 'data', (data: Buffer) => {
            if (options.mergeStdOutErr) {
                stdoutBuffers.push(data);
                stderrBuffers.push(data);
            } else {
                stderrBuffers.push(data);
            }
        });

        proc.once('close', () => {
            if (deferred.completed) {
                return;
            }
            const stderr: string | undefined = stderrBuffers.length === 0 ? undefined : this.decoder.decode(stderrBuffers, encoding);
            if (stderr && stderr.length > 0 && options.throwOnStdErr) {
                deferred.reject(new StdErrError(stderr));
            } else {
                const stdout = this.decoder.decode(stdoutBuffers, encoding);
                deferred.resolve({ stdout, stderr });
            }
            disposables.forEach(disposable => disposable.dispose());
        });
        proc.once('error', ex => {
            deferred.reject(ex);
            disposables.forEach(disposable => disposable.dispose());
        });

        return deferred.promise;
    }
    private spawn(file: string, args: string[], options: SpawnOptions) {
        const translatedFileName = this.wslUtils.translateToWslPath(file);
        const bashCommand = [translatedFileName].concat(args).map(element => {
            // When passing paths as arguments, ensure they are translated as well.
            if (this.isFile(element)) {
                element = this.wslUtils.translateToWslPath(element);
            }
            return element.indexOf(' ') > 0 ? `'${element}'` : element;
        }).join(' ');

        return this.childProcess.spawn(this.wslUtils.bashExecutablePath, ['-ic', bashCommand], options);
    }

    private isFile(content: string): boolean {
        if (typeof content === 'string' && content.length > 0 && content.indexOf(path.sep) > 0) {
            return fs.existsSync(content);
        } else {
            return false;
        }
    }
}
