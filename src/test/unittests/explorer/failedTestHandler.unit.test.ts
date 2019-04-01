// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { anything, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { CommandManager } from '../../../client/common/application/commandManager';
import { ICommandManager } from '../../../client/common/application/types';
import { Commands } from '../../../client/common/constants';
import { TestCollectionStorageService } from '../../../client/unittests/common/services/storageService';
import { ITestCollectionStorageService, TestFunction, TestStatus, TestSuite } from '../../../client/unittests/common/types';
import { FailedTestHandler } from '../../../client/unittests/explorer/failedTestHandler';
import { noop, sleep } from '../../core';

// tslint:disable:no-any

suite('Unit Tests Test Explorer View Items', () => {
    let failedTestHandler: FailedTestHandler;
    let commandManager: ICommandManager;
    let testStorageService: ITestCollectionStorageService;
    setup(() => {
        commandManager = mock(CommandManager);
        testStorageService = mock(TestCollectionStorageService);
        failedTestHandler = new FailedTestHandler([], instance(commandManager), instance(testStorageService));
    });

    test('Activation will add command handlers (without a resource)', async () => {
        when(testStorageService.onDidChange).thenReturn(noop as any);

        await failedTestHandler.activate(undefined);

        verify(testStorageService.onDidChange).once();
    });
    test('Activation will add command handlers (with a resource)', async () => {
        when(testStorageService.onDidChange).thenReturn(noop as any);

        await failedTestHandler.activate(Uri.file(__filename));

        verify(testStorageService.onDidChange).once();
    });
    test('Change handler will invoke the command to reveal the nodes (for failed and errored items)', async () => {
        const uri = Uri.file(__filename);
        const failedFunc1: TestFunction = { name: 'fn1', time: 0, resource: uri, nameToRun: 'fn1', status: TestStatus.Error };
        const failedFunc2: TestFunction = { name: 'fn2', time: 0, resource: uri, nameToRun: 'fn2', status: TestStatus.Fail };
        const failedSuite1: TestSuite = {
            name: 'suite1', time: 0, resource: uri, nameToRun: 'suite1',
            functions: [], isInstance: false, isUnitTest: false, suites: [], xmlName: 'suite1',
            status: TestStatus.Error
        };
        when(commandManager.executeCommand(Commands.Test_Reveal_Test_Item, anything())).thenResolve();

        failedTestHandler.onDidChangeTestData({ uri, data: failedFunc1 });
        failedTestHandler.onDidChangeTestData({ uri, data: failedFunc2 });
        failedTestHandler.onDidChangeTestData({ uri, data: failedSuite1 });

        // wait for debouncing to take effect.
        await sleep(1);

        verify(commandManager.executeCommand(Commands.Test_Reveal_Test_Item, anything())).times(3);
        verify(commandManager.executeCommand(Commands.Test_Reveal_Test_Item, failedFunc1)).once();
        verify(commandManager.executeCommand(Commands.Test_Reveal_Test_Item, failedFunc2)).once();
        verify(commandManager.executeCommand(Commands.Test_Reveal_Test_Item, failedSuite1)).once();
    });
});
