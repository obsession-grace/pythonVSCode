// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import * as typemoq from 'typemoq';
import { DebugConfiguration, Position, TextDocument } from 'vscode';
import { CommandManager } from '../../../../../client/common/application/commandManager';
import { DocumentManager } from '../../../../../client/common/application/documentManager';
import { ICommandManager, IDocumentManager, IWorkspaceService } from '../../../../../client/common/application/types';
import { WorkspaceService } from '../../../../../client/common/application/workspace';
import { PythonDebugConfigurationService } from '../../../../../client/debugger/extension/configuration/debugConfigurationService';
import { LaunchJsonCompletionCommandHandler } from '../../../../../client/debugger/extension/configuration/launch.json/commandHandler';
import { IDebugConfigurationService } from '../../../../../client/debugger/extension/types';

type LaunchJsonSchema = {
    version: string;
    configurations: DebugConfiguration[]
};

// tslint:disable:no-any no-multiline-string max-func-body-length
suite('Debugging - launch.json Completion Command Handler Provider', () => {
    let commandHandler: LaunchJsonCompletionCommandHandler;
    let commandManager: ICommandManager;
    let workspace: IWorkspaceService;
    let documentManager: IDocumentManager;
    let debugConfigService: IDebugConfigurationService;

    setup(() => {
        commandManager = mock(CommandManager);
        workspace = mock(WorkspaceService);
        documentManager = mock(DocumentManager);
        debugConfigService = mock(PythonDebugConfigurationService);
        commandHandler = new LaunchJsonCompletionCommandHandler([], instance(commandManager),
            instance(workspace), instance(documentManager), instance(debugConfigService));
    });
    test('Activation will register the command', async () => {
        await commandHandler.activate(undefined);
        verify(commandManager.registerCommand('python.SelectAndInsertDebugConfiguration', commandHandler.onSelectAndInsertDebugConfig, commandHandler));
    });
    test('Configuration Array is empty', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const config: LaunchJsonSchema = {
            version: '',
            configurations: []
        };
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => JSON.stringify(config));

        const isEmpty = commandHandler.isConfigurationArrayEmpty(document.object);
        assert.equal(isEmpty, true);
    });
    test('Configuration Array is not empty', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const config: LaunchJsonSchema = {
            version: '',
            configurations: [
                {
                    name: '',
                    request: 'launch',
                    type: 'python'
                }
            ]
        };
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => JSON.stringify(config));

        const isEmpty = commandHandler.isConfigurationArrayEmpty(document.object);
        assert.equal(isEmpty, false);
    });
    test('Cursor is not positioned in the configurations array', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const config: LaunchJsonSchema = {
            version: '',
            configurations: [
                {
                    name: '',
                    request: 'launch',
                    type: 'python'
                }
            ]
        };
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => JSON.stringify(config));
        document.setup(doc => doc.offsetAt(typemoq.It.isAny())).returns(() => 10);

        const cursorPosition = commandHandler.getCursorPositionInConfigurationsArray(document.object, new Position(0, 0));
        assert.equal(cursorPosition, undefined);
    });
    test('Cursor is positioned in the empty configurations array', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const json = `{
        "version": "0.1.0",
        "configurations": [
            # Cursor Position
        ]
    }`;
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => json);
        document.setup(doc => doc.offsetAt(typemoq.It.isAny())).returns(() => json.indexOf('#'));

        const cursorPosition = commandHandler.getCursorPositionInConfigurationsArray(document.object, new Position(0, 0));
        assert.equal(cursorPosition, 'InsideEmptyArray');
    });
    test('Cursor is positioned before an item in the configurations array', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const json = `{
    "version": "0.1.0",
    "configurations": [
        {
            "name":"wow"
        }
    ]
}`;
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => json);
        document.setup(doc => doc.offsetAt(typemoq.It.isAny())).returns(() => json.lastIndexOf('{') - 1);

        const cursorPosition = commandHandler.getCursorPositionInConfigurationsArray(document.object, new Position(0, 0));
        assert.equal(cursorPosition, 'BeforeItem');
    });
    test('Cursor is positioned before an item in the middle of the configurations array', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const json = `{
    "version": "0.1.0",
    "configurations": [
        {
            "name":"wow"
        },{
            "name":"wow"
        }
    ]
}`;
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => json);
        document.setup(doc => doc.offsetAt(typemoq.It.isAny())).returns(() => json.indexOf(',{') + 1);

        const cursorPosition = commandHandler.getCursorPositionInConfigurationsArray(document.object, new Position(0, 0));
        assert.equal(cursorPosition, 'BeforeItem');
    });
    test('Cursor is positioned after an item in the configurations array', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const json = `{
    "version": "0.1.0",
    "configurations": [
        {
            "name":"wow"
        }]
}`;
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => json);
        document.setup(doc => doc.offsetAt(typemoq.It.isAny())).returns(() => json.lastIndexOf('}]') + 1);

        const cursorPosition = commandHandler.getCursorPositionInConfigurationsArray(document.object, new Position(0, 0));
        assert.equal(cursorPosition, 'AfterItem');
    });
    test('Cursor is positioned after an item in the middle of the configurations array', async () => {
        const document = typemoq.Mock.ofType<TextDocument>();
        const json = `{
    "version": "0.1.0",
    "configurations": [
        {
            "name":"wow"
        },{
            "name":"wow"
        }
    ]
}`;
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => json);
        document.setup(doc => doc.offsetAt(typemoq.It.isAny())).returns(() => json.indexOf('},') + 1);

        const cursorPosition = commandHandler.getCursorPositionInConfigurationsArray(document.object, new Position(0, 0));
        assert.equal(cursorPosition, 'AfterItem');
    });
    test('Text to be inserted must be prefixed with a comma', async () => {
        const config = {} as any;
        const expectedText = `,${JSON.stringify(config)}`;

        const textToInsert = commandHandler.getTextForInsertion(config, 'AfterItem');

        assert.equal(textToInsert, expectedText);
    });
    test('Text to be inserted must be suffixed with a comma', async () => {
        const config = {} as any;
        const expectedText = `${JSON.stringify(config)},`;

        const textToInsert = commandHandler.getTextForInsertion(config, 'BeforeItem');

        assert.equal(textToInsert, expectedText);
    });
    test('Text to be inserted must not be prefixed nor suffixed with commas', async () => {
        const config = {} as any;
        const expectedText = JSON.stringify(config);

        const textToInsert = commandHandler.getTextForInsertion(config, 'InsideEmptyArray');

        assert.equal(textToInsert, expectedText);
    });
    test('When inserting the debug config into the json file format the document', async () => {
        const json = `{
            "version": "0.1.0",
            "configurations": [
                {
            "name":"wow"
        },{
            "name":"wow"
        }
    ]
}`;
        const config = {} as any;
        const document = typemoq.Mock.ofType<TextDocument>();
        document.setup(doc => doc.getText(typemoq.It.isAny())).returns(() => json);
        document.setup(doc => doc.offsetAt(typemoq.It.isAny())).returns(() => json.indexOf('},') + 1);
        when(documentManager.applyEdit(anything())).thenResolve();
        when(commandManager.executeCommand('editor.action.formatDocument')).thenResolve();

        await commandHandler.insertDebugConfiguration(document.object, new Position(0, 0), config);

        verify(documentManager.applyEdit(anything())).once();
        verify(commandManager.executeCommand('editor.action.formatDocument')).once();
    });
});
