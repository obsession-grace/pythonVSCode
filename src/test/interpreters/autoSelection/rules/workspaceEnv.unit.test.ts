// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-unnecessary-override no-any max-func-body-length no-invalid-this
import { expect } from 'chai';
import * as path from 'path';
import { SemVer } from 'semver';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { Uri, WorkspaceFolder } from 'vscode';
import { IWorkspaceService } from '../../../../client/common/application/types';
import { WorkspaceService } from '../../../../client/common/application/workspace';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { FileSystem } from '../../../../client/common/platform/fileSystem';
import { PlatformService } from '../../../../client/common/platform/platformService';
import { IFileSystem, IPlatformService } from '../../../../client/common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../../client/common/types';
import { createDeferred } from '../../../../client/common/utils/async';
import { OSType } from '../../../../client/common/utils/platform';
import { InterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection';
import { BaseRuleService } from '../../../../client/interpreter/autoSelection/rules/baseRule';
import { WorkspaceVirtualEnvInterpretersAutoSelectionRule } from '../../../../client/interpreter/autoSelection/rules/workspaceEnv';
import { IInterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection/types';
import { PythonPathUpdaterService } from '../../../../client/interpreter/configuration/pythonPathUpdaterService';
import { IPythonPathUpdaterServiceManager } from '../../../../client/interpreter/configuration/types';
import { IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter, WorkspacePythonPath } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';
import { KnownPathsService } from '../../../../client/interpreter/locators/services/KnownPathsService';

suite('Interpreters - Auto Selection - Workspace Virtual Envs Rule', () => {
    let rule: WorkspaceVirtualEnvInterpretersAutoSelectionRuleTest;
    let stateFactory: IPersistentStateFactory;
    let fs: IFileSystem;
    let state: PersistentState<PythonInterpreter | undefined>;
    let helper: IInterpreterHelper;
    let platform: IPlatformService;
    let pipEnvLocator: IInterpreterLocatorService;
    let virtualEnvLocator: IInterpreterLocatorService;
    let pythonPathUpdaterService: IPythonPathUpdaterServiceManager;
    let workspaceService: IWorkspaceService;
    class WorkspaceVirtualEnvInterpretersAutoSelectionRuleTest extends WorkspaceVirtualEnvInterpretersAutoSelectionRule {
        public async setGlobalInterpreter(interpreter?: PythonInterpreter, manager?: IInterpreterAutoSeletionService): Promise<boolean> {
            return super.setGlobalInterpreter(interpreter, manager);
        }
        public async next(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
            return super.next(resource, manager);
        }
        public async cacheSelectedInterpreter(resource: Resource, interpreter: PythonInterpreter | undefined) {
            return super.cacheSelectedInterpreter(resource, interpreter);
        }
        public async getWorkspaceVirtualEnvInterpreters(resource: Resource): Promise<PythonInterpreter[] | undefined> {
            return super.getWorkspaceVirtualEnvInterpreters(resource);
        }
    }
    setup(() => {
        stateFactory = mock(PersistentStateFactory);
        state = mock(PersistentState);
        fs = mock(FileSystem);
        helper = mock(InterpreterHelper);
        platform = mock(PlatformService);
        pipEnvLocator = mock(KnownPathsService);
        workspaceService = mock(WorkspaceService);
        virtualEnvLocator = mock(KnownPathsService);
        pythonPathUpdaterService = mock(PythonPathUpdaterService);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(anything(), undefined)).thenReturn(instance(state));
        rule = new WorkspaceVirtualEnvInterpretersAutoSelectionRuleTest(instance(fs), instance(helper),
            instance(stateFactory), instance(platform),
            instance(workspaceService), instance(pythonPathUpdaterService),
            instance(pipEnvLocator), instance(virtualEnvLocator));
    });
    test('Invoke next rule if there is no workspace', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');

        rule.setNextRule(nextRule);
        when(platform.osType).thenReturn(OSType.OSX);
        when(helper.getActiveWorkspaceUri(anything())).thenReturn(undefined);
        when(nextRule.autoSelectInterpreter(resource, manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(resource, manager)).once();
        verify(helper.getActiveWorkspaceUri(anything())).once();
    });
    test('Invoke next rule if resource is undefined', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);

        rule.setNextRule(nextRule);
        when(platform.osType).thenReturn(OSType.OSX);
        when(helper.getActiveWorkspaceUri(anything())).thenReturn(undefined);
        when(nextRule.autoSelectInterpreter(undefined, manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(undefined, manager);

        verify(nextRule.autoSelectInterpreter(undefined, manager)).once();
        verify(helper.getActiveWorkspaceUri(anything())).once();
    });
    test('Does not udpate settings when there is no interpreter', async () => {
        await rule.cacheSelectedInterpreter(undefined, {} as any);

        verify(pythonPathUpdaterService.updatePythonPath(anything(), anything(), anything(), anything())).never();
    });
    test('Does not udpate settings when there is not workspace', async () => {
        const resource = Uri.file('x');
        when(helper.getActiveWorkspaceUri(resource)).thenReturn(undefined);

        await rule.cacheSelectedInterpreter(resource, {} as any);

        verify(pythonPathUpdaterService.updatePythonPath(anything(), anything(), anything(), anything())).never();
        verify(helper.getActiveWorkspaceUri(resource)).once();
    });
    test('Update settings', async () => {
        const resource = Uri.file('x');
        const workspacePythonPath: WorkspacePythonPath = { configTarget: 'xyz' as any, folderUri: Uri.parse('folder') };
        const pythonPath = 'python Path to store in settings';
        when(helper.getActiveWorkspaceUri(resource)).thenReturn(workspacePythonPath);

        await rule.cacheSelectedInterpreter(resource, { path: pythonPath } as any);

        verify(pythonPathUpdaterService.updatePythonPath(pythonPath, workspacePythonPath.configTarget, 'load', workspacePythonPath.folderUri)).once();
        verify(helper.getActiveWorkspaceUri(resource)).once();
    });
    test('getWorkspaceVirtualEnvInterpreters will not return any interpreters if there is no workspace ', async () => {

        let envs = await rule.getWorkspaceVirtualEnvInterpreters(undefined);
        expect(envs || []).to.be.lengthOf(0);

        const resource = Uri.file('x');
        when(workspaceService.getWorkspaceFolder(resource)).thenReturn(undefined);
        envs = await rule.getWorkspaceVirtualEnvInterpreters(resource);
        expect(envs || []).to.be.lengthOf(0);
    });
    test('getWorkspaceVirtualEnvInterpreters will not return any interpreters if interpreters are not in workspace folder (windows)', async () => {
        const folderPath = path.join('one', 'two', 'three');
        const interpreter1 = { path: path.join('one', 'two', 'bin', 'python.exe') };
        const folderUri = Uri.file(folderPath);
        const workspaceFolder: WorkspaceFolder = { name: '', index: 0, uri: folderUri };
        const resource = Uri.file('x');

        when(virtualEnvLocator.getInterpreters(resource, true)).thenResolve([interpreter1 as any]);
        when(workspaceService.getWorkspaceFolder(resource)).thenReturn(workspaceFolder);
        when(platform.osType).thenReturn(OSType.Windows);

        const envs = await rule.getWorkspaceVirtualEnvInterpreters(resource);
        expect(envs || []).to.be.lengthOf(0);
    });
    test('getWorkspaceVirtualEnvInterpreters will return workspace related virtual interpreters (windows)', async () => {
        const folderPath = path.join('one', 'two', 'three');
        const interpreter1 = { path: path.join('one', 'two', 'bin', 'python.exe') };
        const interpreter2 = { path: path.join(folderPath, 'venv', 'bin', 'python.exe') };
        const interpreter3 = { path: path.join(path.join('one', 'two', 'THREE'), 'venv', 'bin', 'python.exe') };
        const folderUri = Uri.file(folderPath);
        const workspaceFolder: WorkspaceFolder = { name: '', index: 0, uri: folderUri };
        const resource = Uri.file('x');

        when(virtualEnvLocator.getInterpreters(resource, true)).thenResolve([interpreter1, interpreter2, interpreter3] as any);
        when(workspaceService.getWorkspaceFolder(resource)).thenReturn(workspaceFolder);
        when(platform.osType).thenReturn(OSType.Windows);

        const envs = await rule.getWorkspaceVirtualEnvInterpreters(resource);
        expect(envs).to.be.deep.equal([interpreter2, interpreter3]);
    });
    [OSType.OSX, OSType.Linux].forEach(osType => {
        test(`getWorkspaceVirtualEnvInterpreters will not return any interpreters if interpreters are not in workspace folder (${osType})`, async () => {
            const folderPath = path.join('one', 'two', 'three');
            const interpreter1 = { path: path.join('one', 'two', 'bin', 'python.exe') };
            const folderUri = Uri.file(folderPath);
            const workspaceFolder: WorkspaceFolder = { name: '', index: 0, uri: folderUri };
            const resource = Uri.file('x');

            when(virtualEnvLocator.getInterpreters(resource, true)).thenResolve([interpreter1 as any]);
            when(workspaceService.getWorkspaceFolder(resource)).thenReturn(workspaceFolder);
            when(platform.osType).thenReturn(osType);

            const envs = await rule.getWorkspaceVirtualEnvInterpreters(resource);
            expect(envs || []).to.be.lengthOf(0);
        });
        test(`getWorkspaceVirtualEnvInterpreters will return workspace related virtual interpreters (${osType})`, async () => {
            const folderPath = path.join('one', 'two', 'three');
            const interpreter1 = { path: path.join('one', 'two', 'bin', 'python.exe') };
            const interpreter2 = { path: path.join(folderPath, 'venv', 'bin', 'python.exe') };
            const interpreter3 = { path: path.join(path.join('one', 'two', 'THREE'), 'venv', 'bin', 'python.exe') };
            const folderUri = Uri.file(folderPath);
            const workspaceFolder: WorkspaceFolder = { name: '', index: 0, uri: folderUri };
            const resource = Uri.file('x');

            when(virtualEnvLocator.getInterpreters(resource, true)).thenResolve([interpreter1, interpreter2, interpreter3] as any);
            when(workspaceService.getWorkspaceFolder(resource)).thenReturn(workspaceFolder);
            when(platform.osType).thenReturn(osType);

            const envs = await rule.getWorkspaceVirtualEnvInterpreters(resource);
            expect(envs).to.be.deep.equal([interpreter2]);
        });
    });
    test('Invoke next rule if there is no workspace', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');

        when(nextRule.autoSelectInterpreter(resource, manager)).thenResolve();
        when(helper.getActiveWorkspaceUri(resource)).thenReturn(undefined);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(resource, manager)).once();
        verify(helper.getActiveWorkspaceUri(resource)).once();
    });
    test('Invoke next rule if there is no resouece', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);

        when(nextRule.autoSelectInterpreter(undefined, manager)).thenResolve();
        when(helper.getActiveWorkspaceUri(undefined)).thenReturn(undefined);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(undefined, manager);

        verify(nextRule.autoSelectInterpreter(undefined, manager)).once();
        verify(helper.getActiveWorkspaceUri(undefined)).once();
    });
    test('Use pipEnv if that completes first with results', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const virtualEnvPromise = createDeferred<PythonInterpreter[]>();
        const nextInvoked = createDeferred();
        rule.next = () => Promise.resolve(nextInvoked.resolve());
        rule.getWorkspaceVirtualEnvInterpreters = () => virtualEnvPromise.promise;
        when(pipEnvLocator.getInterpreters(resource)).thenResolve([interpreterInfo]);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(helper.getBestInterpreter(deepEqual([interpreterInfo]))).thenReturn(interpreterInfo);

        rule.cacheSelectedInterpreter = () => Promise.resolve();

        await rule.autoSelectInterpreter(resource, instance(manager));
        virtualEnvPromise.resolve([]);

        expect(nextInvoked.completed).to.be.equal(true, 'Next rule not invoked');
        verify(helper.getActiveWorkspaceUri(resource)).atLeast(1);
        verify(manager.setWorkspaceInterpreter(resource, interpreterInfo)).once();
    });
    test('Use Virtual Env if that completes first with results', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const pipEnvPromise = createDeferred<PythonInterpreter[]>();
        const nextInvoked = createDeferred();
        rule.next = () => Promise.resolve(nextInvoked.resolve());
        rule.getWorkspaceVirtualEnvInterpreters = () => Promise.resolve([interpreterInfo]);
        when(pipEnvLocator.getInterpreters(resource)).thenReturn(pipEnvPromise.promise);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(helper.getBestInterpreter(deepEqual([interpreterInfo]))).thenReturn(interpreterInfo);

        rule.cacheSelectedInterpreter = () => Promise.resolve();

        await rule.autoSelectInterpreter(resource, instance(manager));
        pipEnvPromise.resolve([]);

        expect(nextInvoked.completed).to.be.equal(true, 'Next rule not invoked');
        verify(helper.getActiveWorkspaceUri(resource)).atLeast(1);
        verify(manager.setWorkspaceInterpreter(resource, interpreterInfo)).once();
    });
    test('Wait for virtualEnv if pipEnv completes without any intepreters', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const virtualEnvPromise = createDeferred<PythonInterpreter[]>();
        const nextInvoked = createDeferred();
        rule.next = () => Promise.resolve(nextInvoked.resolve());
        rule.getWorkspaceVirtualEnvInterpreters = () => virtualEnvPromise.promise;
        when(pipEnvLocator.getInterpreters(resource)).thenResolve([]);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(helper.getBestInterpreter(deepEqual(anything()))).thenReturn(interpreterInfo);

        rule.cacheSelectedInterpreter = () => Promise.resolve();

        setTimeout(() => virtualEnvPromise.resolve([interpreterInfo]), 10);
        await rule.autoSelectInterpreter(resource, instance(manager));

        expect(nextInvoked.completed).to.be.equal(true, 'Next rule not invoked');
        verify(helper.getActiveWorkspaceUri(resource)).atLeast(1);
        verify(manager.setWorkspaceInterpreter(resource, interpreterInfo)).once();
    });
    test('Wait for pipEnv if VirtualEnv completes without any intepreters', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const pipEnvPromise = createDeferred<PythonInterpreter[]>();
        const nextInvoked = createDeferred();
        rule.next = () => Promise.resolve(nextInvoked.resolve());
        rule.getWorkspaceVirtualEnvInterpreters = () => Promise.resolve([]);
        when(pipEnvLocator.getInterpreters(resource)).thenResolve([]);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(helper.getBestInterpreter(deepEqual(anything()))).thenReturn(interpreterInfo);

        rule.cacheSelectedInterpreter = () => Promise.resolve();

        setTimeout(() => pipEnvPromise.resolve([interpreterInfo]), 10);
        await rule.autoSelectInterpreter(resource, instance(manager));

        expect(nextInvoked.completed).to.be.equal(true, 'Next rule not invoked');
        verify(helper.getActiveWorkspaceUri(resource)).atLeast(1);
        verify(manager.setWorkspaceInterpreter(resource, interpreterInfo)).once();
    });
});
