// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as path from 'path';
import { Uri } from 'vscode';
import { IWorkspaceService } from '../common/application/types';
import { IServiceManager } from '../ioc/types';
import { SmokeTestLauncher } from './smokTests';

export function activate(serviceManager: IServiceManager) {
    if (path.basename(__filename) !== 'index.js') {
        return;
    }
    const workspace = serviceManager.get<IWorkspaceService>(IWorkspaceService);
    const workspaceFolder = Array.isArray(workspace.workspaceFolders) && workspace.workspaceFolders.length > 0 ?
        workspace.workspaceFolders[0].uri : Uri.file(__filename);
    const pythonSettings = workspace.getConfiguration('python', workspaceFolder);
    if (!pythonSettings.get<boolean>('enableDevTools', false)) {
        return;
    }

    serviceManager.addSingleton<SmokeTestLauncher>(SmokeTestLauncher, SmokeTestLauncher);
    serviceManager.get<SmokeTestLauncher>(SmokeTestLauncher).register();
}
