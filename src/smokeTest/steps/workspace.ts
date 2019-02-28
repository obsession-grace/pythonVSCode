// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Given } from 'cucumber';
import { updateSetting } from '../helpers/settings';
import { context } from './app';
import { setupWorkspaceFolder } from './main';
// import { sleep } from '../helpers';

Given('the workspace is based on {string}', async (folderOrGitRepo: string) => {
    await setupWorkspaceFolder(folderOrGitRepo);
    await updateSetting('python.pythonPath', context.app.activeEnvironment.pythonPath!, context.app.workspacePathOrFolder);

    await context.app.workbench.quickopen.runCommand('View: Close All Editors');
    await context.app.workbench.quickopen.runCommand('Terminal: Kill the Active Terminal Instance');
    await context.app.workbench.quickopen.runCommand('Debug: Stop');
    await context.app.workbench.quickopen.runCommand('Debug: Remove All Breakpoints');
    await context.app.workbench.quickopen.runCommand('View: Close Panel');
    // await sleep(100);
});
