// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { instance, mock, verify } from 'ts-mockito';
import { CommandManager } from '../../client/common/application/commandManager';
import { ICommandManager } from '../../client/common/application/types';
import { CommandRegistry } from '../../client/common/commandRegistry';
import { LaunchJsonUpdaterService } from '../../client/debugger/extension/configuration/launch.json/updaterService';
import { ILaunchJsonUpdaterService } from '../../client/debugger/extension/configuration/types';

suite('Command - Command Registry', () => {
    let registry: CommandRegistry;
    let commandManager: ICommandManager;
    let jsonCompletionCommandHandler: ILaunchJsonUpdaterService;

    setup(() => {
        commandManager = mock(CommandManager);
        jsonCompletionCommandHandler = mock(LaunchJsonUpdaterService);
        registry = new CommandRegistry([], instance(commandManager), instance(jsonCompletionCommandHandler));
    });
    test('Activation will register the required commands', async () => {
        await registry.activate(undefined);
        verify(commandManager.registerCommand('python.SelectAndInsertDebugConfiguration', instance(jsonCompletionCommandHandler).selectAndInsertDebugConfig, instance(jsonCompletionCommandHandler)));
    });
});
