// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-any max-func-body-length no-function-expression no-invalid-this

import { expect } from 'chai';
import * as path from 'path';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { ConfigurationTarget, Uri } from 'vscode';
import { IWorkspaceService } from '../../../../client/common/application/types';
import { WorkspaceService } from '../../../../client/common/application/workspace';
import { ConfigurationService } from '../../../../client/common/configuration/service';
import { PlatformService } from '../../../../client/common/platform/platformService';
import { IPlatformService } from '../../../../client/common/platform/types';
import { IConfigurationService, Resource } from '../../../../client/common/types';
import { createDeferred } from '../../../../client/common/utils/async';
import { getNamesAndValues } from '../../../../client/common/utils/enum';
import { OSType } from '../../../../client/common/utils/platform';
import { WorkspaceInterpreterSelectionStratergy } from '../../../../client/interpreter/autoSelection/stratergies/workspace';
import { PythonPathUpdaterService } from '../../../../client/interpreter/configuration/pythonPathUpdaterService';
import { IPythonPathUpdaterServiceManager } from '../../../../client/interpreter/configuration/types';
import { IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter, WorkspacePythonPath } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';
import { PipEnvService } from '../../../../client/interpreter/locators/services/pipEnvService';
import { WorkspaceVirtualEnvService } from '../../../../client/interpreter/locators/services/workspaceVirtualEnvService';

const delayMs = 5;

suite('Interpreters - Auto Selection - Current Path Stratergy', () => {
    getNamesAndValues<OSType>(OSType).forEach(osType => {
        suite(osType.name, () => {
            class WorkspaceInterpreterSelectionStratergyTest extends WorkspaceInterpreterSelectionStratergy {
                // tslint:disable-next-line:no-unnecessary-override
                public async getWorkspaceVirtualEnvInterpreters(resource: Resource): Promise<PythonInterpreter[] | undefined> {
                    return super.getWorkspaceVirtualEnvInterpreters(resource);
                }
            }
            let stratergy: WorkspaceInterpreterSelectionStratergyTest;
            let helper: IInterpreterHelper;
            let pipEnvInterpreterLocator: IInterpreterLocatorService;
            let workspaceVirtualEnvInterpreterLocator: IInterpreterLocatorService;
            let workspaceService: IWorkspaceService;
            let platformService: IPlatformService;
            let configurationService: IConfigurationService;
            let pythonPathUdpaterService: IPythonPathUpdaterServiceManager;
            setup(() => {
                helper = mock(InterpreterHelper);
                workspaceService = mock(WorkspaceService);
                platformService = mock(PlatformService);
                configurationService = mock(ConfigurationService);
                pythonPathUdpaterService = mock(PythonPathUpdaterService);
                pipEnvInterpreterLocator = mock(PipEnvService);
                workspaceVirtualEnvInterpreterLocator = mock(WorkspaceVirtualEnvService);

                stratergy = new WorkspaceInterpreterSelectionStratergyTest(instance(workspaceService), instance(helper),
                    instance(platformService), instance(configurationService),
                    instance(pythonPathUdpaterService),
                    instance(pipEnvInterpreterLocator), instance(workspaceVirtualEnvInterpreterLocator));
            });

            [undefined, Uri.parse('one')].forEach(resource => {
                const testSuffix = resource ? '(without resource)' : '(with resource)';

                test(`Returns undefined when there are no workspaces ${testSuffix}`, async () => {
                    when(helper.getActiveWorkspaceUri(resource)).thenReturn(undefined);

                    const bestInterpreter = await stratergy.getInterpreter(resource);

                    verify(helper.getActiveWorkspaceUri(resource)).once();
                    expect(bestInterpreter as any).to.be.equal(undefined, 'invalid');
                });
                test(`Returns pipenv when there is a workspace ${testSuffix}`, async () => {
                    const expectedBestInterpreter = 2;
                    const pipEnvs = [1, expectedBestInterpreter, 3];
                    when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
                    when(pipEnvInterpreterLocator.getInterpreters(resource)).thenResolve(pipEnvs as any);
                    when(helper.getBestInterpreter(pipEnvs as any)).thenReturn(expectedBestInterpreter as any);
                    const deferred = createDeferred<undefined>();
                    stratergy.getWorkspaceVirtualEnvInterpreters = () => deferred.promise;

                    const bestInterpreter = await stratergy.getInterpreter(resource);

                    deferred.resolve();
                    verify(helper.getActiveWorkspaceUri(resource)).once();
                    verify(pipEnvInterpreterLocator.getInterpreters(resource)).once();
                    verify(helper.getBestInterpreter(pipEnvs as any)).once();
                    expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter, 'invalid');
                });
                test(`Returns VirtualEnv when there is a workspace ${testSuffix}`, async () => {
                    const expectedBestInterpreter = 2;
                    const virtualEnvs = [1, expectedBestInterpreter, 3];
                    when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
                    const deferred = createDeferred<[]>();
                    when(pipEnvInterpreterLocator.getInterpreters(resource)).thenReturn(deferred.promise);
                    when(helper.getBestInterpreter(virtualEnvs as any)).thenReturn(expectedBestInterpreter as any);
                    stratergy.getWorkspaceVirtualEnvInterpreters = () => Promise.resolve(virtualEnvs as any);

                    const bestInterpreter = await stratergy.getInterpreter(resource);

                    deferred.resolve([]);
                    verify(helper.getActiveWorkspaceUri(resource)).once();
                    verify(pipEnvInterpreterLocator.getInterpreters(resource)).once();
                    verify(helper.getBestInterpreter(virtualEnvs as any)).once();
                    expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter, 'invalid');
                });
                test(`Returns user defined pythonPath in settings, ${testSuffix}`, () => {
                    const pythonPathInConfig = {
                        inspect: () => {
                            return {
                                workspaceValue: 'xyz'
                            };
                        }
                    };
                    when(workspaceService.getConfiguration('python', resource)).thenReturn(pythonPathInConfig as any);
                    const settings = {
                        pythonPath: 'python Path in Config'
                    };
                    when(configurationService.getSettings(resource)).thenReturn(settings as any);

                    const pythonPath = stratergy.getStoredInterpreter(resource);

                    verify(workspaceService.getConfiguration('python', resource)).once();
                    verify(configurationService.getSettings(resource)).once();
                    expect(pythonPath).to.be.equal(settings.pythonPath);
                });
                test(`Returns undefined as there is no python path defined in settings, ${testSuffix}`, () => {
                    const pythonPathInConfig = {
                        inspect: () => {
                            return {};
                        }
                    };
                    when(workspaceService.getConfiguration('python', resource)).thenReturn(pythonPathInConfig as any);

                    const pythonPath = stratergy.getStoredInterpreter(resource);

                    verify(workspaceService.getConfiguration('python', resource)).once();
                    verify(configurationService.getSettings(anything())).never();
                    expect(pythonPath).to.be.equal(undefined, 'invalid');
                });
                test(`Does not store python Path in settings.json when python path is undefined, ${testSuffix}`, async () => {
                    await stratergy.storeInterpreter(resource, undefined as any);

                    verify(pythonPathUdpaterService.updatePythonPath(anything(), anything(), anything(), anything())).never();
                    verify(helper.getActiveWorkspaceUri(anything())).never();
                });
                test(`Does not store python Path in settings.json when there is no active workspace, ${testSuffix}`, async () => {
                    when(helper.getActiveWorkspaceUri(resource)).thenReturn(undefined);

                    await stratergy.storeInterpreter(resource, 'some path');

                    verify(pythonPathUdpaterService.updatePythonPath(anything(), anything(), anything(), anything())).never();
                    verify(helper.getActiveWorkspaceUri(anything())).once();
                });
                test(`Stores python Path in settings.json when python path is a string, ${testSuffix}`, async () => {
                    const interpreterToStore = 'some python path';
                    const workspaceFolderUri = Uri.parse('Workspsace folder');
                    const workspacePythonPath: WorkspacePythonPath = { folderUri: workspaceFolderUri, configTarget: ConfigurationTarget.WorkspaceFolder };
                    when(helper.getActiveWorkspaceUri(resource)).thenReturn(workspacePythonPath);

                    await stratergy.storeInterpreter(resource, interpreterToStore);

                    verify(helper.getActiveWorkspaceUri(resource)).once();
                    verify(pythonPathUdpaterService.updatePythonPath(interpreterToStore, workspacePythonPath.configTarget, 'load', workspaceFolderUri)).once();
                    verify(helper.getActiveWorkspaceUri(anything())).once();
                });
                test(`Stores python Path in settings.json when passing interpreter information, ${testSuffix}`, async () => {
                    const interpreterToStore: PythonInterpreter = { path: 'some python path' } as any;
                    const workspaceFolderUri = Uri.parse('Workspsace folder');
                    const workspacePythonPath: WorkspacePythonPath = { folderUri: workspaceFolderUri, configTarget: ConfigurationTarget.WorkspaceFolder };
                    when(helper.getActiveWorkspaceUri(resource)).thenReturn(workspacePythonPath);

                    await stratergy.storeInterpreter(resource, interpreterToStore);

                    verify(helper.getActiveWorkspaceUri(resource)).once();
                    verify(pythonPathUdpaterService.updatePythonPath(interpreterToStore.path, workspacePythonPath.configTarget, 'load', workspaceFolderUri)).once();
                    verify(helper.getActiveWorkspaceUri(anything())).once();
                });

                test(`Does not return any workspace virtual environment when there is no workspace, ${testSuffix}`, async function () {
                    if (!resource) {
                        return this.skip();
                    }
                    when(workspaceService.getWorkspaceFolder(resource)).thenReturn(undefined);

                    const ingterprerters = await stratergy.getWorkspaceVirtualEnvInterpreters(resource);

                    verify(workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true)).never();
                    expect(ingterprerters).to.be.equal(undefined, 'invalid');
                });
                test(`Returns an empty list of environments, ${testSuffix}`, async function () {
                    if (!resource) {
                        return this.skip();
                    }
                    const workspaceFolderUri = Uri.parse('Workspsace folder');
                    const worksapceFolder = { uri: workspaceFolderUri, name: '', index: 0 };
                    when(workspaceService.getWorkspaceFolder(resource)).thenReturn(worksapceFolder);
                    when(workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true)).thenResolve([]);

                    const ingterprerters = await stratergy.getWorkspaceVirtualEnvInterpreters(resource);

                    verify(workspaceService.getWorkspaceFolder(resource)).once();
                    verify(workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true)).once();
                    expect(ingterprerters).to.be.deep.equal([]);
                });
                test(`Returns a list of environments, ${testSuffix}`, async function () {
                    if (!resource) {
                        return this.skip();
                    }
                    const workspaceFolderUri = Uri.parse('Workspsace folder');
                    const worksapceFolder = { uri: workspaceFolderUri, name: '', index: 0 };
                    const workspaceInterpreters = [{ path: path.join(workspaceFolderUri.fsPath, '.venv', 'python') }] as any;

                    when(workspaceService.getWorkspaceFolder(resource)).thenReturn(worksapceFolder);
                    when(workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true)).thenResolve(workspaceInterpreters);

                    const ingterprerters = await stratergy.getWorkspaceVirtualEnvInterpreters(resource);

                    verify(workspaceService.getWorkspaceFolder(resource)).once();
                    verify(workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true)).once();
                    expect(ingterprerters).to.be.deep.equal(workspaceInterpreters);
                });
                test(`Returns a list of environments where python path start with workspace folder path, ${testSuffix}`, async function () {
                    if (!resource) {
                        return this.skip();
                    }
                    const workspaceFolderUri = Uri.parse('Workspsace folder');
                    const worksapceFolder = { uri: workspaceFolderUri, name: '', index: 0 };
                    const workspaceInterpreters = [{ path: path.join(workspaceFolderUri.fsPath, '.venv', 'python') },
                    { path: path.join('something else', '.venv', 'python') }] as any;

                    when(workspaceService.getWorkspaceFolder(resource)).thenReturn(worksapceFolder);
                    when(workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true)).thenResolve(workspaceInterpreters);

                    const ingterprerters = await stratergy.getWorkspaceVirtualEnvInterpreters(resource);

                    verify(workspaceService.getWorkspaceFolder(resource)).once();
                    verify(workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true)).once();
                    expect(ingterprerters).to.be.deep.equal([workspaceInterpreters[0]]);
                });

                [undefined, []].forEach(emptyInterpreters => {
                    test(`Returns pipenv when virtualEnv returns ${JSON.stringify(emptyInterpreters)} first and there is a workspace ${testSuffix}`, async () => {
                        const expectedBestInterpreter = 2;
                        const pipEnvs = [1, expectedBestInterpreter, 3];
                        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
                        const deferred = createDeferred();
                        when(pipEnvInterpreterLocator.getInterpreters(resource)).thenResolve(deferred.promise as any);
                        when(helper.getBestInterpreter(deepEqual(pipEnvs as any))).thenReturn(expectedBestInterpreter as any);
                        stratergy.getWorkspaceVirtualEnvInterpreters = () => Promise.resolve(emptyInterpreters);

                        setTimeout(() => deferred.resolve(pipEnvs), delayMs);
                        const bestInterpreter = await stratergy.getInterpreter(resource);

                        verify(helper.getActiveWorkspaceUri(resource)).once();
                        verify(pipEnvInterpreterLocator.getInterpreters(resource)).once();
                        verify(helper.getBestInterpreter(deepEqual(pipEnvs as any))).once();
                        expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter, 'invalid');
                    });
                    test(`Returns virtualEnv when pipenv returns ${JSON.stringify(emptyInterpreters)} first and there is a workspace ${testSuffix}`, async () => {
                        const expectedBestInterpreter = 2;
                        const virtualEnvs = [1, expectedBestInterpreter, 3];
                        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
                        const deferred = createDeferred();
                        when(pipEnvInterpreterLocator.getInterpreters(resource)).thenResolve(emptyInterpreters as any);
                        when(helper.getBestInterpreter(deepEqual(virtualEnvs as any))).thenReturn(expectedBestInterpreter as any);
                        stratergy.getWorkspaceVirtualEnvInterpreters = () => deferred.promise as any;

                        setTimeout(() => deferred.resolve(virtualEnvs), delayMs);
                        const bestInterpreter = await stratergy.getInterpreter(resource);

                        verify(helper.getActiveWorkspaceUri(resource)).once();
                        verify(pipEnvInterpreterLocator.getInterpreters(resource)).once();
                        verify(helper.getBestInterpreter(deepEqual(virtualEnvs as any))).once();
                        expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter, 'invalid');
                    });
                    test(`Returns undefined when virtualEnv returns ${JSON.stringify(emptyInterpreters)} first, pipEnv returns ${JSON.stringify(emptyInterpreters)} and there is a workspace ${testSuffix}`, async () => {
                        const expectedBestInterpreter = undefined;
                        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
                        const deferred = createDeferred();
                        when(pipEnvInterpreterLocator.getInterpreters(resource)).thenResolve(emptyInterpreters as any);
                        when(helper.getBestInterpreter(deepEqual([]))).thenReturn(expectedBestInterpreter as any);
                        stratergy.getWorkspaceVirtualEnvInterpreters = () => deferred.promise as any;

                        setTimeout(() => deferred.resolve(emptyInterpreters), delayMs);
                        const bestInterpreter = await stratergy.getInterpreter(resource);

                        verify(helper.getActiveWorkspaceUri(resource)).once();
                        verify(pipEnvInterpreterLocator.getInterpreters(resource)).once();
                        verify(helper.getBestInterpreter(deepEqual([]))).once();
                        expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter, 'invalid');
                    });
                    test(`Returns undefined when pipenv returns ${JSON.stringify(emptyInterpreters)} first, virtualEnv returns ${JSON.stringify(emptyInterpreters)} and there is a workspace ${testSuffix}`, async () => {
                        const expectedBestInterpreter = undefined;
                        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
                        const deferred = createDeferred();
                        when(pipEnvInterpreterLocator.getInterpreters(resource)).thenResolve(emptyInterpreters as any);
                        when(helper.getBestInterpreter(deepEqual([]))).thenReturn(expectedBestInterpreter as any);
                        stratergy.getWorkspaceVirtualEnvInterpreters = () => deferred.promise as any;

                        setTimeout(() => deferred.resolve(emptyInterpreters), delayMs);
                        const bestInterpreter = await stratergy.getInterpreter(resource);

                        verify(helper.getActiveWorkspaceUri(resource)).once();
                        verify(pipEnvInterpreterLocator.getInterpreters(resource)).once();
                        verify(helper.getBestInterpreter(deepEqual([]))).once();
                        expect(bestInterpreter as any).to.be.equal(expectedBestInterpreter, 'invalid');
                    });
                });
            });
        });
    });
});
