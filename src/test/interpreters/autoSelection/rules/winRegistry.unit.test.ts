// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-unnecessary-override no-any max-func-body-length no-invalid-this

import * as assert from 'assert';
import { SemVer } from 'semver';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { FileSystem } from '../../../../client/common/platform/fileSystem';
import { PlatformService } from '../../../../client/common/platform/platformService';
import { IFileSystem, IPlatformService } from '../../../../client/common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../../client/common/types';
import { OSType } from '../../../../client/common/utils/platform';
import { InterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection';
import { BaseRuleService } from '../../../../client/interpreter/autoSelection/rules/baseRule';
import { WindowsRegistryInterpretersAutoSelectionRule } from '../../../../client/interpreter/autoSelection/rules/winRegistry';
import { IInterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection/types';
import { IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';
import { KnownPathsService } from '../../../../client/interpreter/locators/services/KnownPathsService';

suite('Interpreters - Auto Selection - Windows Registry Rule', () => {
    let rule: WindowsRegistryInterpretersAutoSelectionRuleTest;
    let stateFactory: IPersistentStateFactory;
    let fs: IFileSystem;
    let state: PersistentState<PythonInterpreter | undefined>;
    let helper: IInterpreterHelper;
    let platform: IPlatformService;
    let locator: IInterpreterLocatorService;
    class WindowsRegistryInterpretersAutoSelectionRuleTest extends WindowsRegistryInterpretersAutoSelectionRule {
        public async setGlobalInterpreter(interpreter?: PythonInterpreter, manager?: IInterpreterAutoSeletionService): Promise<boolean> {
            return super.setGlobalInterpreter(interpreter, manager);
        }
        public async next(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
            return super.next(resource, manager);
        }
    }
    setup(() => {
        stateFactory = mock(PersistentStateFactory);
        state = mock(PersistentState);
        fs = mock(FileSystem);
        helper = mock(InterpreterHelper);
        platform = mock(PlatformService);
        locator = mock(KnownPathsService);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter|undefined>(anything(), undefined)).thenReturn(instance(state));
        rule = new WindowsRegistryInterpretersAutoSelectionRuleTest(instance(fs), instance(helper),
            instance(stateFactory), instance(platform), instance(locator));
    });
    test('Invoke next rule if OS is not windows', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');

        rule.setNextRule(nextRule);
        when(platform.osType).thenReturn(OSType.OSX);
        when(locator.getInterpreters(anything())).thenResolve([]);
        when(nextRule.autoSelectInterpreter(resource, manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(resource, manager)).once();
        verify(locator.getInterpreters(anything())).never();
    });
    test('Invoke next rule if OS is windows and there are no interpreters in the registry', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');

        rule.setNextRule(nextRule);
        when(platform.osType).thenReturn(OSType.Windows);
        when(locator.getInterpreters(anything())).thenResolve([]);
        when(nextRule.autoSelectInterpreter(resource, manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(resource, manager)).once();
        verify(locator.getInterpreters(anything())).once();
    });
    test('Invoke next rule if fails to update global state', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const resource = Uri.file('x');
        let nextInvoked = false;

        rule.next = async () => { nextInvoked = true; return Promise.resolve(); };
        rule.setGlobalInterpreter = async () => Promise.resolve(false);
        when(platform.osType).thenReturn(OSType.Windows);
        when(helper.getBestInterpreter(anything())).thenReturn(interpreterInfo);
        when(locator.getInterpreters(resource)).thenResolve([interpreterInfo]);

        await rule.autoSelectInterpreter(resource, manager);

        assert.equal(nextInvoked, true);
    });
    test('Not Invoke next rule if succeeeds to update global state', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const resource = Uri.file('x');
        let nextInvoked = false;

        rule.next = async () => { nextInvoked = true; return Promise.resolve(); };
        rule.setGlobalInterpreter = async () => Promise.resolve(true);
        when(platform.osType).thenReturn(OSType.Windows);
        when(helper.getBestInterpreter(anything())).thenReturn(interpreterInfo);
        when(locator.getInterpreters(resource)).thenResolve([interpreterInfo]);

        await rule.autoSelectInterpreter(resource, manager);

        assert.equal(nextInvoked, false);
    });
});
