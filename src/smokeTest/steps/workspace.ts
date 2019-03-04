// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Given } from 'cucumber';
import * as path from 'path';
import { Setting, updateSetting } from '../helpers/settings';
import { context } from './app';
import { setupWorkspaceFolder } from './main';

Given('the workspace is based on {string}', async (folderOrGitRepo: string) => {
    await setupWorkspaceFolder(folderOrGitRepo);
    await updateSetting('python.pythonPath', context.app.activeEnvironment.pythonPath!, context.app.workspacePathOrFolder);
    const env = context.app.activeEnvironment;

    for (const setting of Object.keys(env['workspace.settings']) as Setting[]) {
        await updateSetting(setting, env['workspace.settings'][setting], context.app.workspacePathOrFolder);
    }

    await context.app.workbench.quickopen.runCommand('View: Close All Editors');
    await context.app.workbench.quickopen.runCommand('Terminal: Kill the Active Terminal Instance');
    await context.app.workbench.quickopen.runCommand('Debug: Stop');
    await context.app.workbench.quickopen.runCommand('Debug: Remove All Breakpoints');
    await context.app.workbench.quickopen.runCommand('View: Close Panel');
});
