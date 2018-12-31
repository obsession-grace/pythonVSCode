// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-unnecessary-override no-any max-func-body-length no-invalid-this

import { anything, instance, mock, verify, when } from 'ts-mockito';
import { IWorkspaceService } from '../../../../client/common/application/types';
import { WorkspaceService } from '../../../../client/common/application/workspace';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { FileSystem } from '../../../../client/common/platform/fileSystem';
import { IFileSystem } from '../../../../client/common/platform/types';
import { IPersistentStateFactory } from '../../../../client/common/types';
import { InterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection';
import { BaseRuleService } from '../../../../client/interpreter/autoSelection/rules/baseRule';
import { SettingsInterpretersAutoSelectionRule } from '../../../../client/interpreter/autoSelection/rules/settings';
import { PythonInterpreter } from '../../../../client/interpreter/contracts';

suite('Interpreters - Auto Selection - Settings Rule', () => {
    let rule: SettingsInterpretersAutoSelectionRule;
    let stateFactory: IPersistentStateFactory;
    let fs: IFileSystem;
    let state: PersistentState<PythonInterpreter | undefined>;
    let workspaceService: IWorkspaceService;
    setup(() => {
        stateFactory = mock(PersistentStateFactory);
        state = mock(PersistentState);
        fs = mock(FileSystem);
        workspaceService = mock(WorkspaceService);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(anything(), undefined)).thenReturn(instance(state));
        rule = new SettingsInterpretersAutoSelectionRule(instance(fs),
            instance(stateFactory), instance(workspaceService));
    });

    test('Invoke next rule if python Path in user settings is default', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const pythonPathInConfig = { globalValue: 'python' };
        const pythonPath = { inspect: () => pythonPathInConfig };

        rule.setNextRule(nextRule);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();
        when(workspaceService.getConfiguration('python', null as any)).thenReturn(pythonPath as any);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(undefined, manager);

        verify(nextRule.autoSelectInterpreter(anything(), manager)).once();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
    test('Invoke next rule if python Path in user settings is default', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const pythonPathInConfig = {};
        const pythonPath = { inspect: () => pythonPathInConfig };

        rule.setNextRule(nextRule);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();
        when(workspaceService.getConfiguration('python', null as any)).thenReturn(pythonPath as any);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(undefined, manager);

        verify(nextRule.autoSelectInterpreter(anything(), manager)).once();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
    test('Must not Invoke next rule if python Path in user settings is not default', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const pythonPathInConfig = { globalValue: 'something else' };
        const pythonPath = { inspect: () => pythonPathInConfig };

        rule.setNextRule(nextRule);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();
        when(workspaceService.getConfiguration('python', null as any)).thenReturn(pythonPath as any);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(undefined, manager);

        verify(nextRule.autoSelectInterpreter(anything(), manager)).never();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
});
