// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-unnecessary-override no-any max-func-body-length no-invalid-this

import { expect } from 'chai';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { IWorkspaceService } from '../../../client/common/application/types';
import { WorkspaceService } from '../../../client/common/application/workspace';
import { PersistentState, PersistentStateFactory } from '../../../client/common/persistentState';
import { FileSystem } from '../../../client/common/platform/fileSystem';
import { IFileSystem } from '../../../client/common/platform/types';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../../client/common/types';
import { InterpreterAutoSeletionService } from '../../../client/interpreter/autoSelection';
import { InterpreterAutoSeletionProxyService } from '../../../client/interpreter/autoSelection/proxy';
import { CurrentPathInterpreterSelectionStratergy } from '../../../client/interpreter/autoSelection/stratergies/currentPath';
import { SystemInterpreterSelectionStratergy } from '../../../client/interpreter/autoSelection/stratergies/system';
import { WindowsRegistryInterpreterSelectionStratergy } from '../../../client/interpreter/autoSelection/stratergies/windowsRegistry';
import { WorkspaceInterpreterSelectionStratergy } from '../../../client/interpreter/autoSelection/stratergies/workspace';
import { IBestAvailableInterpreterSelectorStratergy } from '../../../client/interpreter/autoSelection/types';
import { IInterpreterHelper, PythonInterpreter } from '../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../client/interpreter/helpers';

const preferredGlobalInterpreter = 'preferredGlobalInterpreter';

suite('Interpreters - Auto Selection', () => {
    let systemStratergy: SystemInterpreterSelectionStratergy;
    let currentPathStratergy: CurrentPathInterpreterSelectionStratergy;
    let winRegStratergy: WindowsRegistryInterpreterSelectionStratergy;
    let workspaceStratergy: WorkspaceInterpreterSelectionStratergy;
    let helper: IInterpreterHelper;
    let stateFactory: IPersistentStateFactory;
    let state: IPersistentState<PythonInterpreter | undefined>;
    let workspaceService: IWorkspaceService;
    let proxy: InterpreterAutoSeletionProxyService;
    let fs: IFileSystem;

    class InterpreterAutoSeletionServiceTest extends InterpreterAutoSeletionService {
        public async autoSelectInterpreterFromStratergy(resource: Resource, stratergy: IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | undefined>): Promise<boolean> {
            return super.autoSelectInterpreterFromStratergy(resource, stratergy);
        }
        public autoSelectBestAvailableSystemInterpreterInBackground(resource: Resource) {
            super.autoSelectBestAvailableSystemInterpreterInBackground(resource);
        }
        public async autoSelectWorkspaceInterpreter(resource: Resource): Promise<boolean> {
            return super.autoSelectWorkspaceInterpreter(resource);
        }
        public async getBestAvailableInterpreterFromStoredValues(resource: Resource): Promise<boolean> {
            return super.getBestAvailableInterpreterFromStoredValues(resource);
        }
        public async clearInvalidAutoSelectedInterpreters(resource: Resource): Promise<void> {
            return super.clearInvalidAutoSelectedInterpreters(resource);
        }
        public storeAutoSelectedInterperter(resource: Resource, interpreter: PythonInterpreter | string | undefined) {
            super.storeAutoSelectedInterperter(resource, interpreter);
        }
    }
    let selectionService: InterpreterAutoSeletionServiceTest;
    setup(() => {
        helper = mock(InterpreterHelper);
        fs = mock(FileSystem);
        stateFactory = mock(PersistentStateFactory);
        workspaceService = mock(WorkspaceService);
        proxy = mock(InterpreterAutoSeletionProxyService);
        systemStratergy = mock(SystemInterpreterSelectionStratergy);
        currentPathStratergy = mock(CurrentPathInterpreterSelectionStratergy);
        winRegStratergy = mock(WindowsRegistryInterpreterSelectionStratergy);
        workspaceStratergy = mock(WorkspaceInterpreterSelectionStratergy);
        state = mock<PersistentState<PythonInterpreter | undefined>>(PersistentState);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(preferredGlobalInterpreter, undefined)).thenReturn(instance(state));
        selectionService = new InterpreterAutoSeletionServiceTest(instance(helper), instance(fs), instance(stateFactory),
            instance(proxy), instance(workspaceService),
            instance(systemStratergy), instance(currentPathStratergy),
            instance(winRegStratergy), instance(workspaceStratergy));
    });

    // test('Store is created', () => {
    //     verify(stateFactory.createGlobalPersistentState(preferredGlobalInterpreter, undefined)).once();
    // });
    // test('Instance is injected into proxy', () => {
    //     verify(proxy.registerInstance(selectionService)).once();
    // });
    [undefined, Uri.parse('one')].forEach(resource => {
        const suffix = resource ? '(with a resource)' : '(without a resource)';

        test(`Change evnet is fired ${suffix}`, () => {
            let changed = false;
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);

            selectionService.storeAutoSelectedInterperter(resource, 'xyz');

            expect(changed).to.be.equal(true, 'Change event not fired');
        });
        test(`Auto selected interpreter must be undefined ${suffix}`, () => {
            const value = selectionService.getAutoSelectedInterpreter(resource);

            verify(state.value).once();
            expect(value).to.be.equal(undefined, 'should be undefined');
        });
        test(`Get stored interprter path ${suffix}`, () => {
            const pythonPath = 'some value';
            selectionService.storeAutoSelectedInterperter(resource, pythonPath);

            const value = selectionService.getAutoSelectedInterpreter(resource);

            verify(state.value).never();
            expect(value).to.be.equal(pythonPath);
        });
        test(`Get stored interprter path when storing the interpreter info ${suffix}`, () => {
            const pythonPath = 'some value';
            const info = { path: pythonPath };
            selectionService.storeAutoSelectedInterperter(resource, info as any);

            const value = selectionService.getAutoSelectedInterpreter(resource);

            verify(state.value).never();
            expect(value).to.be.equal(pythonPath);
        });
        test(`Get stored interprter path from state ${suffix}`, () => {
            const pythonPath = 'some value';
            const info = { path: pythonPath };
            when(state.value).thenReturn(info as any);

            const value = selectionService.getAutoSelectedInterpreter(resource);

            expect(value).to.be.equal(pythonPath);
        });
        test(`Invalid Python paths returned by stratergies are cleared ${suffix}`, async () => {
            const sysIntepreter = { path: 'python Path 1' };
            when(fs.fileExists(sysIntepreter.path)).thenResolve(false);
            when(systemStratergy.getStoredInterpreter(resource)).thenReturn(sysIntepreter as any);

            const currentPathIntepreter = { path: 'python Path 2' };
            when(fs.fileExists(currentPathIntepreter.path)).thenResolve(false);
            when(currentPathStratergy.getStoredInterpreter(resource)).thenReturn(currentPathIntepreter as any);

            const winRegPathIntepreter = { path: 'python Path 3' };
            when(fs.fileExists(winRegPathIntepreter.path)).thenResolve(false);
            when(winRegStratergy.getStoredInterpreter(resource)).thenReturn(winRegPathIntepreter as any);

            const GlobalPathIntepreter = { path: 'python Path 4' };
            when(fs.fileExists(GlobalPathIntepreter.path)).thenResolve(false);
            when(state.value).thenReturn(GlobalPathIntepreter as any);

            await selectionService.clearInvalidAutoSelectedInterpreters(resource);

            verify(fs.fileExists(sysIntepreter.path)).atLeast(1);
            verify(fs.fileExists(currentPathIntepreter.path)).atLeast(1);
            verify(fs.fileExists(winRegPathIntepreter.path)).atLeast(1);
            verify(state.value).atLeast(1);

            verify(systemStratergy.storeInterpreter(resource, undefined)).once();
            verify(currentPathStratergy.storeInterpreter(resource, undefined)).once();
            verify(winRegStratergy.storeInterpreter(resource, undefined)).once();
            verify(state.updateValue(undefined)).once();
        });
        test(`Valid Python paths returned by stratergies are not cleared ${suffix}`, async () => {
            const sysIntepreter = { path: 'python Path 1' };
            when(fs.fileExists(sysIntepreter.path)).thenResolve(true);
            when(systemStratergy.getStoredInterpreter(resource)).thenReturn(sysIntepreter as any);

            const currentPathIntepreter = { path: 'python Path 2' };
            when(fs.fileExists(currentPathIntepreter.path)).thenResolve(true);
            when(currentPathStratergy.getStoredInterpreter(resource)).thenReturn(currentPathIntepreter as any);

            const winRegPathIntepreter = { path: 'python Path 3' };
            when(fs.fileExists(winRegPathIntepreter.path)).thenResolve(true);
            when(winRegStratergy.getStoredInterpreter(resource)).thenReturn(winRegPathIntepreter as any);

            const GlobalPathIntepreter = { path: 'python Path 4' };
            when(fs.fileExists(GlobalPathIntepreter.path)).thenResolve(true);
            when(state.value).thenReturn(GlobalPathIntepreter as any);

            await selectionService.clearInvalidAutoSelectedInterpreters(resource);

            verify(fs.fileExists(sysIntepreter.path)).atLeast(1);
            verify(fs.fileExists(currentPathIntepreter.path)).atLeast(1);
            verify(fs.fileExists(winRegPathIntepreter.path)).atLeast(1);
            verify(state.value).atLeast(1);

            verify(systemStratergy.storeInterpreter(resource, undefined)).never();
            verify(currentPathStratergy.storeInterpreter(resource, undefined)).never();
            verify(winRegStratergy.storeInterpreter(resource, undefined)).never();
            verify(state.updateValue(undefined)).never();
        });
        test(`Pick best available interpreters from preivously stored/identified values and upate stores ${suffix}`, async () => {
            let changed = false;
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);

            const sysIntepreter = { path: 'python Path 1' };
            when(systemStratergy.getStoredInterpreter(resource)).thenReturn(sysIntepreter as any);
            const currentPathIntepreter = { path: 'python Path 2' };
            when(currentPathStratergy.getStoredInterpreter(resource)).thenReturn(currentPathIntepreter as any);
            const winRegPathIntepreter = { path: 'python Path 3' };
            when(winRegStratergy.getStoredInterpreter(resource)).thenReturn(winRegPathIntepreter as any);

            when(helper.getBestInterpreter(deepEqual([sysIntepreter, currentPathIntepreter, winRegPathIntepreter]))).thenReturn(currentPathIntepreter as any);

            const isAvailable = await selectionService.getBestAvailableInterpreterFromStoredValues(resource);
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            verify(state.updateValue(currentPathIntepreter as any)).once();
            expect(isAvailable).to.be.equal(true, 'Should be true');
            expect(bestAvailable).to.be.equal(currentPathIntepreter.path);
            expect(changed).to.be.equal(true, 'Change event not fired');
        });
        test(`Pick best available interpreters from preivously stored/identified values but do not udpate state ${suffix}`, async () => {
            let changed = false;
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);

            const sysIntepreter = { path: 'python Path 1' };
            when(systemStratergy.getStoredInterpreter(resource)).thenReturn(sysIntepreter as any);
            const currentPathIntepreter = { path: 'python Path 2' };
            when(currentPathStratergy.getStoredInterpreter(resource)).thenReturn(currentPathIntepreter as any);
            const winRegPathIntepreter = { path: 'python Path 3' };
            when(winRegStratergy.getStoredInterpreter(resource)).thenReturn(winRegPathIntepreter as any);
            when(state.value).thenReturn(currentPathIntepreter as any);

            when(helper.getBestInterpreter(deepEqual([sysIntepreter, currentPathIntepreter, winRegPathIntepreter]))).thenReturn(currentPathIntepreter as any);

            const isAvailable = await selectionService.getBestAvailableInterpreterFromStoredValues(resource);
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            verify(state.updateValue(anything())).never();
            expect(isAvailable).to.be.equal(true, 'Should be true');
            expect(bestAvailable).to.be.equal(currentPathIntepreter.path);
            expect(changed).to.be.equal(true, 'Change event not fired');
        });
        test(`Should not pick workspace interpreters if there is no workspace ${suffix}`, async () => {
            when(helper.getActiveWorkspaceUri(resource)).thenReturn(undefined);

            const isAvailable = await selectionService.autoSelectWorkspaceInterpreter(resource);

            verify(helper.getActiveWorkspaceUri(resource)).once();
            expect(isAvailable).to.be.equal(false, 'invalid value');
        });
        test(`Should pick workspace interpreters and must store it ${suffix}`, async () => {
            let changed = false;
            const pythonPath = 'some virtual Env Interpereter';
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);
            when(helper.getActiveWorkspaceUri(resource)).thenReturn('zbc' as any);
            when(workspaceStratergy.getStoredInterpreter(resource)).thenReturn(pythonPath);

            const isAvailable = await selectionService.autoSelectWorkspaceInterpreter(resource);
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            verify(helper.getActiveWorkspaceUri(resource)).once();
            expect(isAvailable).to.be.equal(true, 'invalid value');
            expect(bestAvailable).to.be.equal(pythonPath);
            expect(changed).to.be.equal(true, 'Change event not fired');
        });
        test(`Should query and pick workspace interpreters and must store it and update workspace store ${suffix}`, async () => {
            let changed = false;
            const pythonPath = 'some virtual Env Interpereter';
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);
            when(helper.getActiveWorkspaceUri(resource)).thenReturn('zbc' as any);
            when(workspaceStratergy.getStoredInterpreter(resource)).thenReturn(undefined);
            when(workspaceStratergy.getInterpreter(resource)).thenResolve(pythonPath);
            when(workspaceStratergy.storeInterpreter(resource, pythonPath)).thenResolve();

            const isAvailable = await selectionService.autoSelectWorkspaceInterpreter(resource);
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            verify(helper.getActiveWorkspaceUri(resource)).once();
            expect(isAvailable).to.be.equal(true, 'invalid value');
            expect(bestAvailable).to.be.equal(pythonPath);
            expect(changed).to.be.equal(true, 'Change event not fired');
            verify(workspaceStratergy.storeInterpreter(resource, pythonPath)).once();
        });
        test(`Should query and not pick workspace interpreters and not store it ${suffix}`, async () => {
            let changed = false;
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);
            when(helper.getActiveWorkspaceUri(resource)).thenReturn('zbc' as any);
            when(workspaceStratergy.getStoredInterpreter(resource)).thenReturn(undefined);
            when(workspaceStratergy.getInterpreter(resource)).thenResolve(undefined);

            const isAvailable = await selectionService.autoSelectWorkspaceInterpreter(resource);
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            verify(helper.getActiveWorkspaceUri(resource)).once();
            expect(isAvailable).to.be.equal(false, 'invalid value');
            expect(bestAvailable).to.be.equal(undefined, 'should be undefined');
            expect(changed).to.be.equal(false, 'Change event fired');
            verify(workspaceStratergy.storeInterpreter(anything(), anything())).never();
        });
        test(`Should pick pre-selected interpreter rather than querying ${suffix}`, async () => {
            let changed = false;
            const info = { path: 'python Path 1' };
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);
            when(systemStratergy.getStoredInterpreter(resource)).thenReturn(info as any);

            const isAvailable = await selectionService.autoSelectInterpreterFromStratergy(resource, instance(systemStratergy));
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            expect(isAvailable).to.be.equal(true, 'invalid value');
            expect(bestAvailable).to.be.equal(info.path);
            expect(changed).to.be.equal(true, 'Change event not fired');
            verify(systemStratergy.getInterpreter(anything())).never();
        });
        test(`Should query and pick an interpreter ${suffix}`, async () => {
            let changed = false;
            const info = { path: 'python Path 1' };
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);
            when(systemStratergy.getStoredInterpreter(resource)).thenReturn(undefined);
            when(systemStratergy.getInterpreter(resource)).thenResolve(info as any);

            const isAvailable = await selectionService.autoSelectInterpreterFromStratergy(resource, instance(systemStratergy));
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            expect(isAvailable).to.be.equal(true, 'invalid value');
            expect(bestAvailable).to.be.equal(info.path);
            expect(changed).to.be.equal(true, 'Change event not fired');
            verify(systemStratergy.getInterpreter(anything())).once();
            verify(systemStratergy.storeInterpreter(resource, info as any)).once();
        });
        test(`Should not pick anything as there are no interpreters ${suffix}`, async () => {
            let changed = false;
            selectionService.onDidChangeAutoSelectedInterpreter(() => changed = true);
            when(systemStratergy.getStoredInterpreter(resource)).thenReturn(undefined);
            when(systemStratergy.getInterpreter(resource)).thenResolve(undefined);

            const isAvailable = await selectionService.autoSelectInterpreterFromStratergy(resource, instance(systemStratergy));
            const bestAvailable = selectionService.getAutoSelectedInterpreter(resource);

            expect(isAvailable).to.be.equal(false, 'invalid value');
            expect(bestAvailable).to.be.equal(undefined, 'should be undefined');
            expect(changed).to.be.equal(false, 'Change event fired');
            verify(systemStratergy.getInterpreter(anything())).once();
            verify(systemStratergy.storeInterpreter(anything(), anything())).never();
        });
    });
});
