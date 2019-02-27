// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Given, Then, When } from 'cucumber';
import { sleep } from '../helpers';
import { updateDebugConfiguration } from '../helpers/settings';
import { context } from './app';

Given('the debug sidebar is open', async () => {
    await context.app.workbench.debug.openDebugViewlet();
});

When('I configure the debugger', async () => {
    await context.app.workbench.debug.configure();
});

When('I add a breakpoint to line {int}', async (line: number) => {
    await context.app.workbench.quickopen.runCommand('Go to Line...');
    await context.app.workbench.quickopen.waitForQuickOpenOpened(10);
    await context.app.code.dispatchKeybinding('1');
    await context.app.code.dispatchKeybinding('Enter');
    await sleep(100);
    await context.app.workbench.debug.setBreakpointOnLine(line);
});

When('stopOnEntry is true in launch.json', async () => {
    await updateDebugConfiguration('stopOnEntry', true, context.app.workspacePathOrFolder, 0);
});

When('stopOnEntry is false in launch.json', async () => {
    await updateDebugConfiguration('stopOnEntry', false, context.app.workspacePathOrFolder, 0);
});

Then('debugger starts', async () => {
    await context.app.workbench.debug.debuggerHasStarted();
});

When('I open the debug console', async () => {
    // await context.app.workbench.debug.openDebugConsole();
    await context.app.workbench.quickopen.runCommand('View: Debug Console');
});

Then('number of variables in variable window is {int}', async (count: number) => {
    await context.app.workbench.debug.waitForVariableCount(count);
});

When('I step over', async () => {
    // await context.app.workbench.debug.stepOver();
    await context.app.workbench.quickopen.runCommand('Debug: Step Over');
});

When('I step in', async () => {
    // await context.app.workbench.debug.stepIn();
    await context.app.workbench.quickopen.runCommand('Debug: Step Into');
});

When('I continue', async () => {
    // await context.app.workbench.debug.continue();
    await context.app.workbench.quickopen.runCommand('Debug: Continue');
});

Then('stack frame for file {string} is displayed', async (file: string) => {
    await context.app.workbench.debug.waitForStackFrame(
        sf => sf.name.indexOf(file) >= 0,
        'looking for main.py'
    );
});

Then('debugger stops', async () => {
    await context.app.workbench.debug.debuggerHasStopped();
});

Then('stack frame for file {string} and line {int} is displayed', async (file: string, line: number) => {
    await context.app.workbench.debug.waitForStackFrame(
        sf => sf.name.indexOf(file) >= 0 && sf.lineNumber === line,
        'looking for main.py'
    );
});

Then('the text {string} is displayed in the debug console', async (text: string) => {
    await context.app.workbench.debug.waitForOutput(output => {
        return output.some(line => line.indexOf(text) >= 0);
    });
});
