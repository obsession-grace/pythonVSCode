// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import { Disposable, OutputChannel } from 'vscode';
import { CommandManager } from '../../client/common/application/commandManager';
import { DocumentManager } from '../../client/common/application/documentManager';
import { ICommandManager, IDocumentManager, IWorkspaceService } from '../../client/common/application/types';
import { WorkspaceService } from '../../client/common/application/workspace';
import { IDisposableRegistry, IOutputChannel } from '../../client/common/types';
import { ServiceContainer } from '../../client/ioc/container';
import { IServiceContainer } from '../../client/ioc/types';
import { CommandSource, TEST_OUTPUT_CHANNEL } from '../../client/unittests/common/constants';
import { Tests, TestStatus } from '../../client/unittests/common/types';
import { TestResultDisplay } from '../../client/unittests/display/main';
import { UnitTestManagementService } from '../../client/unittests/main';
import { ITestResultDisplay } from '../../client/unittests/types';
import { TestManager } from '../../client/unittests/unittest/main';

// tslint:disable:no-any

suite('Unit Tests - Test Management Service', () => {
    let managementService: UnitTestManagementService;
    let serviceContainer: IServiceContainer;
    let commandManager: ICommandManager;
    setup(() => {
        serviceContainer = mock(ServiceContainer);
        commandManager = mock(CommandManager);
        const workspaceService = mock(WorkspaceService);
        const documentManager = mock(DocumentManager);

        when(serviceContainer.get<Disposable[]>(IDisposableRegistry)).thenReturn([]);
        when(serviceContainer.get<OutputChannel>(IOutputChannel, TEST_OUTPUT_CHANNEL)).thenReturn({} as any);
        when(serviceContainer.get<IWorkspaceService>(IWorkspaceService)).thenReturn(instance(workspaceService));
        when(serviceContainer.get<IDocumentManager>(IDocumentManager)).thenReturn(instance(documentManager));
        when(serviceContainer.get<ICommandManager>(ICommandManager)).thenReturn(instance(commandManager));
        managementService = new UnitTestManagementService(instance(serviceContainer));
    });

    async function contextIsSetWhenTestDiscoveryCompletes(testDiscoveryFails = false) {
        const testManager = mock(TestManager);
        const instanceOfTestManager = instance(testManager);
        const testResultDisplay = mock(TestResultDisplay);
        (instanceOfTestManager as any).then = undefined;
        when(serviceContainer.get<ITestResultDisplay>(ITestResultDisplay)).thenReturn(instance(testResultDisplay));
        when(testManager.status).thenReturn(TestStatus.Idle);
        const discoveryReturnValue = testDiscoveryFails ? Promise.reject<Tests>() : Promise.resolve<Tests>(undefined as any);
        when(testManager.discoverTests(anything(), anything(), anything(), anything())).thenReturn(discoveryReturnValue);
        when(testResultDisplay.displayDiscoverStatus(anything(), anything())).thenReturn(Promise.resolve<Tests>(undefined as any));
        managementService.getTestManager = () => Promise.resolve(instanceOfTestManager);

        let failed = false;
        try {
            await managementService.discoverTests(CommandSource.testExplorer, undefined, false, true, false);
        } catch {
            failed = true;
        }

        assert.equal(failed, testDiscoveryFails);
        verify(commandManager.executeCommand('setContext', 'testsDiscovered', true)).once();
    }
    test('Context is set when tests discovery runs successfully', () => contextIsSetWhenTestDiscoveryCompletes(false));
    test('Context is set when tests discovery fails', () => contextIsSetWhenTestDiscoveryCompletes(true));
});
