// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Given, Then, When } from 'cucumber';
import { context } from './app';
import * as path from 'path';
import * as fs from 'fs-extra';
import { sleep } from '../../client/common/utils/async';
import { expect } from 'chai';

When('I close all editors', async () => {
    await context.app.workbench.quickopen.runCommand('View: Close All Editors');
});

Given('the file {string} is open', async (file: string) => {
    await context.app.workbench.quickopen.openFile(file);
});
Then('the file {string} will be opened', async (file: string) => {
    await context.app.workbench.quickopen.isFileOpen(file);
});
Then('code lens {string} is visible', async (title: string) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration a', true);
    const expectedLenses = eles.filter(item => item.textContent.trim().indexOf(title) === 0);
    expect(expectedLenses).to.be.lengthOf.greaterThan(0);
});

Given('the file {string} does not exist', async (file: string) => {
    const filePath = path.join(context.app.workspacePathOrFolder, file);
    if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath);
    }
});

When('I open the file {string}', async (file: string) => {
    await context.app.workbench.quickopen.openFile(file);
});

Given('the file is scrolled to the top', async () => {
    await context.app.workbench.quickopen.runCommand('Go to Line...');
    await context.app.workbench.quickopen.waitForQuickOpenOpened(10);
    await context.app.code.dispatchKeybinding('1');
    await context.app.code.dispatchKeybinding('Enter');
    await sleep(100);
});

Given('the file {string} is updated with the value {string}', async (file: string, value: string) => {
    await fs.writeFile(path.join(context.app.workspacePathOrFolder, file), value);
});

When('I update file {string} with value {string}', async (file: string, value: string) => {
    await fs.writeFile(path.join(context.app.workspacePathOrFolder, file), value);
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
    await context.app.workbench.editor.waitForEditorContents(file, contents => contents.indexOf(`${text}`) > -1);
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
