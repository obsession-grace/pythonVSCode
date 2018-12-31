// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-unnecessary-override no-any max-func-body-length no-invalid-this

import { SemVer } from 'semver';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import * as typemoq from 'typemoq';
import { Uri } from 'vscode';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { FileSystem } from '../../../../client/common/platform/fileSystem';
import { IFileSystem } from '../../../../client/common/platform/types';
import { IPersistentStateFactory, Resource } from '../../../../client/common/types';
import { InterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection';
import { BaseRuleService } from '../../../../client/interpreter/autoSelection/rules/baseRule';
import { CachedInterpretersAutoSelectionRule } from '../../../../client/interpreter/autoSelection/rules/cached';
import { SystemWideInterpretersAutoSelectionRule } from '../../../../client/interpreter/autoSelection/rules/system';
import { IInterpreterAutoSeletionRule, IInterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection/types';
import { IInterpreterHelper, PythonInterpreter } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';

suite('Interpreters - Auto Selection - Cached Rule', () => {
    let rule: CachedInterpretersAutoSelectionRuleTest;
    let stateFactory: IPersistentStateFactory;
    let fs: IFileSystem;
    let state: PersistentState<PythonInterpreter | undefined>;
    let systemInterpreter: IInterpreterAutoSeletionRule;
    let currentPathInterpreter: IInterpreterAutoSeletionRule;
    let winRegInterpreter: IInterpreterAutoSeletionRule;
    let helper: IInterpreterHelper;
    class CachedInterpretersAutoSelectionRuleTest extends CachedInterpretersAutoSelectionRule {
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
        systemInterpreter = mock(SystemWideInterpretersAutoSelectionRule);
        currentPathInterpreter = mock(SystemWideInterpretersAutoSelectionRule);
        winRegInterpreter = mock(SystemWideInterpretersAutoSelectionRule);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(anything(), undefined)).thenReturn(instance<PersistentState<PythonInterpreter | undefined>>(state));
        rule = new CachedInterpretersAutoSelectionRuleTest(instance(fs), instance(helper),
            instance(stateFactory), instance(systemInterpreter),
            instance(currentPathInterpreter), instance(winRegInterpreter));
    });

    test('Invoke next rule if there are no cached intepreters', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');

        rule.setNextRule(nextRule);
        when(systemInterpreter.getPreviouslyAutoSelectedInterpreter(resource)).thenReturn(undefined);
        when(currentPathInterpreter.getPreviouslyAutoSelectedInterpreter(resource)).thenReturn(undefined);
        when(winRegInterpreter.getPreviouslyAutoSelectedInterpreter(resource)).thenReturn(undefined);
        when(nextRule.autoSelectInterpreter(resource, manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(systemInterpreter.getPreviouslyAutoSelectedInterpreter(resource)).once();
        verify(currentPathInterpreter.getPreviouslyAutoSelectedInterpreter(resource)).once();
        verify(winRegInterpreter.getPreviouslyAutoSelectedInterpreter(resource)).once();
        verify(nextRule.autoSelectInterpreter(resource, manager)).once();
    });
    test('Invoke next rule if fails to update global state', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const winRegInterpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const resource = Uri.file('x');

        when(helper.getBestInterpreter(deepEqual(anything()))).thenReturn(winRegInterpreterInfo);
        when(systemInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).thenReturn(undefined);
        when(currentPathInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).thenReturn(undefined);
        when(winRegInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).thenReturn(winRegInterpreterInfo);

        const moq = typemoq.Mock.ofInstance(rule, typemoq.MockBehavior.Loose, true);
        moq.callBase = true;
        moq.setup(m => m.setGlobalInterpreter(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve(false))
            .verifiable(typemoq.Times.once());
        moq.setup(m => m.next(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve())
            .verifiable(typemoq.Times.once());
        await moq.object.autoSelectInterpreter(resource, manager);

        verify(systemInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).once();
        verify(currentPathInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).once();
        verify(winRegInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).once();
        moq.verifyAll();
    });
    test('Not Invoke next rule if succeeds to update global state', async () => {
        const manager = mock(InterpreterAutoSeletionService);
        const winRegInterpreterInfo = { path: '1', version: new SemVer('1.0.0') } as any;
        const resource = Uri.file('x');

        when(helper.getBestInterpreter(deepEqual(anything()))).thenReturn(winRegInterpreterInfo);
        when(systemInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).thenReturn(undefined);
        when(currentPathInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).thenReturn(undefined);
        when(winRegInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).thenReturn(winRegInterpreterInfo);

        const moq = typemoq.Mock.ofInstance(rule, typemoq.MockBehavior.Loose, true);
        moq.callBase = true;
        moq.setup(m => m.setGlobalInterpreter(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve(true))
            .verifiable(typemoq.Times.once());
        moq.setup(m => m.next(typemoq.It.isAny(), typemoq.It.isAny()))
            .returns(() => Promise.resolve())
            .verifiable(typemoq.Times.never());
        await moq.object.autoSelectInterpreter(resource, manager);

        verify(systemInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).once();
        verify(currentPathInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).once();
        verify(winRegInterpreter.getPreviouslyAutoSelectedInterpreter(anything())).once();
        moq.verifyAll();
    });
});
