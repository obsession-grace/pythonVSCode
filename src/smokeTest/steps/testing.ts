// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { expect } from 'chai';
import { Given, Then, When } from 'cucumber';
import { sleep } from '../helpers';
import { updateSetting } from '../helpers/settings';
import { context } from './app';

Given('the test framework is {word}', async (testFramework: string) => {
    await updateSetting('python.unitTest.nosetestsEnabled', testFramework === 'nose', context.app.workspacePathOrFolder);
    await updateSetting('python.unitTest.pyTestEnabled', testFramework === 'pytest', context.app.workspacePathOrFolder);
    await updateSetting('python.unitTest.unittestEnabled', testFramework === 'unittest', context.app.workspacePathOrFolder);
});
Then('the toolbar button with the text {string} is visible', async (title: string) => {
    await context.app.code.waitForElement(`div[id="workbench.parts.sidebar"] a[title="${title}"]`);
});
Then('the toolbar button with the text {string} is not visible', async (title: string) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.parts.sidebar"] ul[aria-label="PYTHON actions"] li a', true);
    assert.equal(eles.find(ele => ele.attributes['title'] === title), undefined);
});
Then('select first node', async () => {
    // await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.has-children:nth-child(1) a.label-name:nth-child(1n)');
    await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.monaco-tree-row:nth-child(1) a.label-name:nth-child(1n)');
});
Then('select second node', async () => {
    // await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.has-children:nth-child(2) a.label-name:nth-child(1n)');
    await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.monaco-tree-row:nth-child(2) a.label-name:nth-child(1n)');
});
Then('has {int} error test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="status-error.svg"]', true);
    assert.equal(eles.length, count);
});
Then('has at least {int} error test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="status-error.svg"]', true);
    expect(eles).to.be.lengthOf.greaterThan(count - 1);
});
Then('has {int} success test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="status-ok.svg"]', true);
    assert.equal(eles.length, count);
});
Then('has {int} running test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="discovering-tests.svg"]', true);
    assert.equal(eles.length, count);
});
Then('has at least {int} running test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="discovering-tests.svg"]', true);
    expect(eles).to.be.lengthOf.greaterThan(count - 1);
});
When('I select test tree node number {int} and press run', async (count: number) => {
    const selector = `div.monaco-tree-row:nth-child(${count}) div.monaco-icon-label.custom-view-tree-node-item-resourceLabel > div.actions > div > ul a[title="Run"]`;
    await context.app.code.waitAndClick(selector);
});
When('I select test tree node number {int} and press open', async (count: number) => {
    const selector = `div.monaco-tree-row:nth-child(${count}) div.monaco-icon-label.custom-view-tree-node-item-resourceLabel a[title="Open"]`;
    await context.app.code.waitAndClick(selector);
});
When('I select test tree node number {int} and press debug', async (count: number) => {
    const selector = `div.monaco-tree-row:nth-child(${count}) div.monaco-icon-label.custom-view-tree-node-item-resourceLabel a[title="Debug"]`;
    await context.app.code.waitAndClick(selector);
});
When('I select test tree node number {int}', async (count: number) => {
    await context.app.code.waitAndClick(`div[id="workbench.view.extension.test"] div.monaco-tree-row:nth-child(${count}) a.label-name:nth-child(1n)`);
});
When('I stop the tests', async () => {
    const selector = 'div[id="workbench.parts.sidebar"] a[title="Stop"]';
    await context.app.code.waitAndClick(selector);
});
When('I click first code lens "Run Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(2) a:nth-child(1)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.equal('Run Test');
    await context.app.code.waitAndClick(selector);
});

When('I click first code lens "Debug Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(2) a:nth-child(3)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.equal('Debug Test');
    await context.app.code.waitAndClick(selector);
});

When('I click second code lens "Debug Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(3) a:nth-child(3)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.equal('Debug Test');
    await context.app.code.waitAndClick(selector);
});

When('I click second code lens "Run Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(3) a:nth-child(1)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.equal('Run Test');
    await context.app.code.waitAndClick(selector);
});

Then('do it', async () => {
    // const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.content.custom-view-tree-node-item a.label-name', true);
    await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.has-children:nth-child(2n) a.label-name:nth-child(1n)');
    await sleep(100);
    await context.app.code.dispatchKeybinding('right');
    await sleep(100);
    await context.app.code.dispatchKeybinding('right');
    await sleep(100);
    await context.app.code.dispatchKeybinding('right');
    await sleep(100);
    await context.app.code.dispatchKeybinding('right');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('right');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('down');
    await sleep(100);
    await context.app.code.dispatchKeybinding('right');
    await sleep(100);
    await context.app.code.dispatchKeybinding('right');
    await sleep(100);
    // await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.has-children:nth-child(2n) div.content > div:first-child');
    // await sleep(100);
    // await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.has-children:nth-child(2n) div.content');
    // await sleep(100);
    // await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.has-children:nth-child(2n)');
    // await sleep(100);
    // await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.has-children:nth-child(3n) div.content > div:first-child');
    // const ele = eles[0];
    // ele.
});
