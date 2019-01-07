// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-any no-unused-expression chai-vague-errors no-unnecessary-override max-func-body-length max-classes-per-file

import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationTarget, Disposable } from 'vscode';
import { FileSystem } from '../client/common/platform/fileSystem';
import { PlatformService } from '../client/common/platform/platformService';
import { Diagnostics } from '../client/common/utils/localize';
import { EXTENSION_ROOT_DIR } from '../client/constants';
import { initialize, SourceMapSupport } from '../client/sourceMapSupport';
import { noop, sleep } from './core';

suite('Source Map Support', () => {
    function createVSCStub(isEnabled: boolean = false, selectDisableButton: boolean = false) {
        const stubInfo = {
            configValueRetrieved: false,
            configValueUpdated: false,
            messageDisplayed: false
        };
        const vscode = {
            workspace: {
                getConfiguration: (setting: string, _defaultValue: any) => {
                    if (setting !== 'python.diagnostics') {
                        return;
                    }
                    return {
                        get: (prop: string) => {
                            stubInfo.configValueRetrieved = prop === 'sourceMapsEnabled';
                            return isEnabled;
                        },
                        update: (prop: string, value: boolean, scope: ConfigurationTarget) => {
                            if (prop === 'sourceMapsEnabled' && value === false && scope === ConfigurationTarget.Global) {
                                stubInfo.configValueUpdated = true;
                            }
                        }
                    };
                }
            },
            window: {
                showWarningMessage: () => {
                    stubInfo.messageDisplayed = true;
                    return Promise.resolve(selectDisableButton ? Diagnostics.disableSourceMaps() : undefined);
                }
            },
            ConfigurationTarget: ConfigurationTarget
        };
        return { stubInfo, vscode };
    }

    const disposables: Disposable[] = [];
    teardown(() => {
        disposables.forEach(disposable => {
            try {
                disposable.dispose();
            } catch { noop(); }
        });
    });
    test('Test message is not displayed when source maps are not enabled', async () => {
        const stub = createVSCStub(false);
        initialize(stub.vscode as any);
        await sleep(100);
        expect(stub.stubInfo.configValueRetrieved).to.be.equal(true, 'Config Value not retrieved');
        expect(stub.stubInfo.messageDisplayed).to.be.equal(false, 'Message displayed');
    });
    test('Test message is not displayed when source maps are not enabled', async () => {
        const stub = createVSCStub(true);
        const instance = new class extends SourceMapSupport {
            protected async enableSourceMaps(enable: boolean) {
                noop();
            }
        }(stub.vscode as any);
        await instance.initialize();
        expect(stub.stubInfo.configValueRetrieved).to.be.equal(true, 'Config Value not retrieved');
        expect(stub.stubInfo.messageDisplayed).to.be.equal(true, 'Message displayed');
        expect(stub.stubInfo.configValueUpdated).to.be.equal(false, 'Config Value updated');
    });
    test('Test message is not displayed when source maps are not enabled', async () => {
        const stub = createVSCStub(true, true);
        const instance = new class extends SourceMapSupport {
            protected async enableSourceMaps(enable: boolean) {
                noop();
            }
        }(stub.vscode as any);

        await instance.initialize();
        expect(stub.stubInfo.configValueRetrieved).to.be.equal(true, 'Config Value not retrieved');
        expect(stub.stubInfo.messageDisplayed).to.be.equal(true, 'Message displayed');
        expect(stub.stubInfo.configValueUpdated).to.be.equal(true, 'Config Value not updated');
    });
    async function testRenamingFilesWhenEnablingDisablingSourceMaps(enableSourceMaps: boolean) {
        const stub = createVSCStub(true, true);
        const sourceFilesPassed: string[] = [];
        const instance = new class extends SourceMapSupport {
            public async enableSourceMaps(enable: boolean) {
                return super.enableSourceMaps(enable);
            }
            public async enableSourceMap(enable: boolean, sourceFile: string) {
                expect(enable).to.equal(enableSourceMaps);
                sourceFilesPassed.push(sourceFile);
                return Promise.resolve();
            }
        }(stub.vscode as any);

        await instance.enableSourceMaps(enableSourceMaps);
        const extensionSourceMap = path.join(EXTENSION_ROOT_DIR, 'out', 'client', 'extension.js');
        const debuggerSourceMap = path.join(EXTENSION_ROOT_DIR, 'out', 'client', 'debugger', 'debugAdapter', 'main.js');
        expect(sourceFilesPassed).to.deep.equal([extensionSourceMap, debuggerSourceMap]);
    }
    test('Rename extension and debugger source maps when enabling source maps', () => testRenamingFilesWhenEnablingDisablingSourceMaps(true));
    test('Rename extension and debugger source maps when disabling source maps', () => testRenamingFilesWhenEnablingDisablingSourceMaps(false));
    test('When disabling source maps, the map file is renamed and vice versa', async () => {
        const fileSystem = new FileSystem(new PlatformService());
        const jsFile = await fileSystem.createTemporaryFile('.js');
        disposables.push(jsFile);
        const mapFile = `${jsFile.filePath}.map`;
        disposables.push({
            dispose: () => fs.unlinkSync(mapFile)
        });
        await fileSystem.writeFile(mapFile, 'ABC');
        expect(await fileSystem.fileExists(mapFile)).to.be.true;

        const stub = createVSCStub(true, true);
        const instance = new class extends SourceMapSupport {
            public async enableSourceMap(enable: boolean, sourceFile: string) {
                return super.enableSourceMap(enable, sourceFile);
            }
        }(stub.vscode as any);

        await instance.enableSourceMap(false, jsFile.filePath);

        expect(await fileSystem.fileExists(jsFile.filePath)).to.be.equal(true, 'Source file does not exist');
        expect(await fileSystem.fileExists(mapFile)).to.be.equal(false, 'Source map file not renamed');
        expect(await fileSystem.fileExists(`${mapFile}.disabled`)).to.be.equal(true, 'Expected renamed file not found');

        await instance.enableSourceMap(true, jsFile.filePath);

        expect(await fileSystem.fileExists(jsFile.filePath)).to.be.equal(true, 'Source file does not exist');
        expect(await fileSystem.fileExists(mapFile)).to.be.equal(true, 'Source map file not found');
        expect(await fileSystem.fileExists(`${mapFile}.disabled`)).to.be.equal(false, 'Source map file not renamed');
    });
});
