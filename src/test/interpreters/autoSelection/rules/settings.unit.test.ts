// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-unnecessary-override no-any max-func-body-length no-invalid-this

import { anything, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { IWorkspaceService } from '../../../../client/common/application/types';
import { WorkspaceService } from '../../../../client/common/application/workspace';
import { PersistentState, PersistentStateFactory } from '../../../../client/common/persistentState';
import { FileSystem } from '../../../../client/common/platform/fileSystem';
import { IFileSystem } from '../../../../client/common/platform/types';
import { IPersistentStateFactory } from '../../../../client/common/types';
import { InterpreterAutoSeletionService } from '../../../../client/interpreter/autoSelection';
import { BaseRuleService } from '../../../../client/interpreter/autoSelection/rules/baseRule';
import { SettingsInterpretersAutoSelectionRule } from '../../../../client/interpreter/autoSelection/rules/settings';
import { IInterpreterHelper, PythonInterpreter } from '../../../../client/interpreter/contracts';
import { InterpreterHelper } from '../../../../client/interpreter/helpers';

suite('Interpreters - Auto Selection - Settings Rule', () => {
    let rule: SettingsInterpretersAutoSelectionRule;
    let stateFactory: IPersistentStateFactory;
    let fs: IFileSystem;
    let state: PersistentState<PythonInterpreter | undefined>;
    let helper: IInterpreterHelper;
    let workspaceService: IWorkspaceService;
    setup(() => {
        stateFactory = mock(PersistentStateFactory);
        state = mock(PersistentState);
        fs = mock(FileSystem);
        helper = mock(InterpreterHelper);
        workspaceService = mock(WorkspaceService);

        when(stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(anything(), undefined)).thenReturn(instance(state));
        rule = new SettingsInterpretersAutoSelectionRule(instance(fs), instance(helper),
            instance(stateFactory), instance(workspaceService));
    });

    test('Invoke next rule if there is resource', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);

        rule.setNextRule(nextRule);
        when(helper.getActiveWorkspaceUri(undefined)).thenReturn(undefined);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(undefined, manager);

        verify(nextRule.autoSelectInterpreter(anything(), manager)).once();
        verify(helper.getActiveWorkspaceUri(undefined)).once();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
    test('Invoke next rule if there is noworkspace', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');

        rule.setNextRule(nextRule);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn(undefined);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(anything(), manager)).once();
        verify(helper.getActiveWorkspaceUri(resource)).once();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
    test('Invoke next rule if settings are empty', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const pythonPathInConfig = {};
        const pythonPath = { inspect: () => pythonPathInConfig };

        rule.setNextRule(nextRule);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();
        when(workspaceService.getConfiguration('python', resource)).thenReturn(pythonPath as any);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(anything(), manager)).once();
        verify(helper.getActiveWorkspaceUri(resource)).once();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
    test('Invoke next rule if python Path in settings = python', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const pythonPathInConfig = { globalValue: 'python', workspaceValue: 'python', workspaveFolderValue: 'python' };
        const pythonPath = { inspect: () => pythonPathInConfig };

        rule.setNextRule(nextRule);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();
        when(workspaceService.getConfiguration('python', resource)).thenReturn(pythonPath as any);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, manager);

        verify(nextRule.autoSelectInterpreter(anything(), manager)).once();
        verify(helper.getActiveWorkspaceUri(resource)).once();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
    test('Invoke next rule if python Path in user settings is python', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const config = { globalValue: 'python', workspaceValue: 'python', workspaceFolderValue: 'python' };
        const pythonPath = { inspect: () => config };

        rule.setNextRule(nextRule);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();
        when(workspaceService.getConfiguration('python', resource)).thenReturn(pythonPath as any);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, instance(manager));

        verify(nextRule.autoSelectInterpreter(anything(), anything())).once();
        verify(helper.getActiveWorkspaceUri(resource)).once();
        verify(manager.setWorkspaceInterpreter(anything(), anything())).never();
    });
    test('Must not Invoke next rule if python Path in user settings is not python', async () => {
        const nextRule = mock(BaseRuleService);
        const manager = mock(InterpreterAutoSeletionService);
        const resource = Uri.file('x');
        const config = { globalValue: 'custom Python Path', workspaceValue: 'python', workspaceFolderValue: 'python' };
        const pythonPath = { inspect: () => config };

        rule.setNextRule(nextRule);
        when(helper.getActiveWorkspaceUri(resource)).thenReturn({} as any);
        when(nextRule.autoSelectInterpreter(anything(), manager)).thenResolve();
        when(workspaceService.getConfiguration('python', resource)).thenReturn(pythonPath as any);

        rule.setNextRule(instance(nextRule));
        await rule.autoSelectInterpreter(resource, instance(manager));

        verify(nextRule.autoSelectInterpreter(anything(), manager)).never();
        verify(helper.getActiveWorkspaceUri(resource)).once();
        verify(manager.setGlobalInterpreter(anything())).never();
    });
});
