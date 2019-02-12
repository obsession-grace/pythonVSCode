// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { Given, Then, When } from 'cucumber';
import * as path from 'path';
import { sleep } from '../helpers';
import { getSetting, removeSetting, updateSetting } from '../helpers/settings';
import { PipEnvEnviroment, VenvEnviroment } from '../setup/config';
import { waitForExtensionToActivate } from '../tests/activation/helper';
import { createPipEnv, createVenv, deletePipEnv, deleteVenvs, getDisplayPath, getPythonInterpreterPath, interpreterInStatusBarDisplaysCorrectPath, selectGenericInterpreter, waitForPythonPathInStatusBar } from '../tests/interpreters/helper';
import { context } from './app';

Given('there are no pipenv environments', async () => {
    await deletePipEnv(context.app);
});

Given('there are no virtual environments in the workspace', async () => {
    await deleteVenvs(context.app);
});

When('I select some random interpreter', async () => {
    await selectGenericInterpreter(context.app);
});

When('I create a pipenv environment', async () => {
    await createPipEnv(context.app.activeEnvironment as PipEnvEnviroment, context.app);
});

When('I create a venv environment with the name {string}', async (venvName: string) => {
    const venvEnv = context.app.activeEnvironment as VenvEnviroment;
    venvEnv.venvArgs = [venvName];
    await createVenv(venvEnv, context.app);
});

When('I change the python path in settings.json to {string}', async (pythonPath: string) => {
    await updateSetting('python.pythonPath', pythonPath, context.app.workspacePathOrFolder);
});

Given('there is no python path in settings.json', async () => {
    const pythonPath = await getPythonInterpreterPath('python');
    await removeSetting('python.pythonPath', context.app.workspacePathOrFolder);
    await updateSetting('python.pythonPath', pythonPath, path.dirname(context.app.configuration.userSettingsJsonPath));
    await interpreterInStatusBarDisplaysCorrectPath(pythonPath, context.app);
});

When('I reload vscode', async (pythonPath: string) => {
    await context.app.reload();
    await waitForExtensionToActivate(context.app);
});

Then('settings.json will automatically be updated with pythonPath', async () => {
    const currentPythonPath = await getSetting<string | undefined>('python.pythonPath', context.app.workspacePathOrFolder);
    assert.notEqual(currentPythonPath, undefined);
    await interpreterInStatusBarDisplaysCorrectPath(currentPythonPath!, context.app);
});

Then('the selected interpreter contains the name {string}', async (name: string) => {
    const pythonPathInSettings = await getSetting<string>('python.pythonPath', context.app.workspacePathOrFolder);
    const tooltip = getDisplayPath(pythonPathInSettings, context.app.workspacePathOrFolder);

    const text = await context.app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
    assert.notEqual(text.indexOf(name), -1, `'${name}' not found in display name`);
});

Then('a message containing the text {string} will be displayed', async (message: string) => {
    await context.app.workbench.quickinput.waitForMessage(message);
    try {
        await sleep(100);
        await context.app.code.waitAndClick('.action-label.icon.clear-notification-action');
        await sleep(100);
        await context.app.code.waitAndClick('.action-label.icon.clear-notification-action');
        await sleep(100);
    } catch {
        // Do nothing.
    }
});

Then('interpreter informantion in status bar has refreshed', async () => {
    const tooltip = getDisplayPath(context.app.activeEnvironment.pythonPath!, context.app.workspacePathOrFolder);
    const text = await context.app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
    context.app.activeEnvironment.displayNameParts.forEach(item => assert.notEqual(text.indexOf(item), -1, `'${item}' not found in display name`));
});
