// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Given, Then, When } from 'cucumber';
import { context } from './app';

When('I close all editors', async () => {
    await context.app.workbench.quickopen.runCommand('View: Close All Editors');
});

Given('the file {string} is open', async (file: string) => {
    await context.app.workbench.quickopen.openFile(file);
});

When('I open the file {string}', async (file: string) => {
    await context.app.workbench.quickopen.openFile(file);
});

When('I select the text {string} in line {int} of file {string}', async (selection: string, line: number, file: string) => {
    await context.app.workbench.editor.clickOnTerm(file, selection, line);
});

When('I set cursor to line {int} of file {string}', async (line: number, file: string) => {
    await context.app.workbench.editor.waitForEditorFocus(file, line);
});

When('I press {string}', async (keyStroke: string) => {
    await context.app.code.dispatchKeybinding(keyStroke);
});

Then('line {int} of file {string} will be highlighted', async (line: number, file: string) => {
    await context.app.workbench.editor.waitForHighlightingLine(file, line);
});

Then('text {string} will appear in the file {string}', async (text: number, file: string) => {
    await context.app.workbench.editor.waitForEditorContents(file, contents => contents.indexOf(text) > -1);
});

When('I type the text {string} into the file {string}', async (text: string, file: string) => {
    await context.app.workbench.editor.waitForTypeInEditor(file, text);
});

When('I go to definition for {string} in line {int} of file {string}', async (selection: string, line: number, file: string) => {
    await context.app.workbench.quickopen.openFile(file);
    await context.app.workbench.editor.clickOnTerm(file, selection, line);
    await context.app.code.dispatchKeybinding('right');
    await context.app.code.dispatchKeybinding('F12');
});
