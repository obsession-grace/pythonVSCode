// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-unnecessary-override no-any max-func-body-length no-invalid-this

import { SemVer } from 'semver';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import * as typemoq from 'typemoq';
import { Uri } from 'vscode';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { FileSystem } from '../../../../client/common/platform/fileSystem';
import { IFileSystem } from '../../../../client/common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../../client/common/types';
import { InterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection';
import { BaseRuleService } from '../../../../client/interpreter/autoSelection/rules/baseRule';
import { CurrentPathInterpretersAutoSelectionRule } from '../../../../client/interpreter/autoSelection/rules/currentPath';
import { IInterpreterAutoSeletionRule, IInterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection/types';
import { IInterpreterHelper, IInterpreterLocatorService, PythonInterpreter } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';
import { KnownPathsService } from '../../../../client/interpreter/locators/services/KnownPathsService';

suite('Interpreters - Auto Selection - Current Path Rule', () => {
    let rule: CurrentPathInterpretersAutoSelectionRuleTest;
    let stateFactory: IPersistentStateFactory;
    let fs: IFileSystem;
    let state: PersistentState<PythonInterpreter | undefined>;
    let locator: IInterpreterLocatorService;
    let helper: IInterpreterHelper;
    class CurrentPathInterpretersAutoSelectionRuleTest extends CurrentPathInterpretersAutoSelectionRule {
        public readonly rules!: IInterpreterAutoSeletionRule[];
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
        locator = mock(KnownPathsService);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(anything(), undefined)).thenReturn(instance<PersistentState<PythonInterpreter | undefined>>(state));
        rule = new CurrentPathInterpretersAutoSelectionRuleTest(instance(fs), instance(helper),
            instance(stateFactory), instance(locator));
    });

    test('Invoke next rule if there are no intepreters in the current path', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');

        rule.setNextRule(nextRule);
        when(locator.getInterpreters(resource)).thenResolve([]);
        when(nextRule.autoSelectInterpreter(resource, manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(resource, manager)).once();
        verify(locator.getInterpreters(resource)).once();
    });
    test('Invoke next rule if fails to update global state', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const resource = Uri.file('x');

        when(helper.getBestInterpreter(anything())).thenReturn(interpreterInfo);
        when(locator.getInterpreters(resource)).thenResolve([interpreterInfo]);

        const moq = typemoq.Mock.ofInstance(rule, typemoq.MockBehavior.Loose, true);
        moq.callBase = true;
        moq.setup(m => m.setGlobalInterpreter(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve(false))
            .verifiable(typemoq.Times.once());
        moq.setup(m => m.next(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve())
            .verifiable(typemoq.Times.once());
        await moq.object.autoSelectInterpreter(resource, manager);

        moq.verifyAll();
    });
    test('Not Invoke next rule if succeeds to update global state', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const interpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const resource = Uri.file('x');

        when(helper.getBestInterpreter(anything())).thenReturn(interpreterInfo);
        when(locator.getInterpreters(resource)).thenResolve([interpreterInfo]);

        const moq = typemoq.Mock.ofInstance(rule, typemoq.MockBehavior.Loose, true);
        moq.callBase = true;
        moq.setup(m => m.setGlobalInterpreter(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve(true))
            .verifiable(typemoq.Times.once());
        moq.setup(m => m.next(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve())
            .verifiable(typemoq.Times.never());
        await moq.object.autoSelectInterpreter(resource, manager);

        moq.verifyAll();
    });
});
