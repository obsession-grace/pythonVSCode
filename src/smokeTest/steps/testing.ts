// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { expect } from 'chai';
import { Given, Then, When } from 'cucumber';
import { noop, sleep } from '../helpers';
import { updateSetting } from '../helpers/settings';
import { context } from './app';

Given('the test framework is {word}', async (testFramework: string) => {
    await updateSetting('python.unitTest.nosetestsEnabled', testFramework === 'nose', context.app.workspacePathOrFolder);
    await updateSetting('python.unitTest.pyTestEnabled', testFramework === 'pytest', context.app.workspacePathOrFolder);
    await updateSetting('python.unitTest.unittestEnabled', testFramework === 'unittest', context.app.workspacePathOrFolder);
});
Then('wait for the test icon to appear within {int} seconds', async (timeout: number) => {
    const icon = '.part.activitybar.left .composite-bar li a[title="Test"]';
    await context.app.code.waitForElement(icon, undefined, timeout * 1000 / 250, 250);
    await sleep(250);
});
Then('wait for the toolbar button with the text {string} to appear within {int} seconds', async (title: string, timeout: number) => {
    const button = `div[id="workbench.parts.sidebar"] a[title="${title}"]`;
    await context.app.code.waitForElement(button, undefined, timeout * 1000 / 250, 250);
    await sleep(1000);
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
Then('there are at least {int} error test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="status-error.svg"]', true);
    expect(eles).to.be.lengthOf.greaterThan(count - 1);
});
Then('there are {int} success test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="status-ok.svg"]', true);
    assert.equal(eles.length, count);
});
Then('there are {int} running test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="discovering-tests.svg"]', true);
    assert.equal(eles.length, count);
});
Then('there are at least {int} running test items', async (count: number) => {
    const eles = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] div.custom-view-tree-node-item-icon[style^="background-image:"][style*="discovering-tests.svg"]', true);
    expect(eles).to.be.lengthOf.greaterThan(count - 1);
});
When('I select test tree node number {int} and press run', async (nodeNumber: number) => {
    await highlightNode(nodeNumber);
    const selector = `div.monaco-tree-row:nth-child(${nodeNumber}) div.monaco-icon-label.custom-view-tree-node-item-resourceLabel > div.actions > div > ul a[title="Run"]`;
    await context.app.code.waitAndClick(selector);
});
When('I select test tree node number {int} and press open', async (nodeNumber: number) => {
    await highlightNode(nodeNumber);
    const selector = `div.monaco-tree-row:nth-child(${nodeNumber}) div.monaco-icon-label.custom-view-tree-node-item-resourceLabel a[title="Open"]`;
    await context.app.code.waitAndClick(selector);
});
When('I select test tree node number {int} and press debug', async (nodeNumber: number) => {
    await highlightNode(nodeNumber);
    const selector = `div.monaco-tree-row:nth-child(${nodeNumber}) div.monaco-icon-label.custom-view-tree-node-item-resourceLabel a[title="Debug"]`;
    await context.app.code.waitAndClick(selector);
});
When('I select test tree node number {int}', async (nodeNumber: number) => {
    await highlightNode(nodeNumber);
    await context.app.code.waitAndClick(`div[id="workbench.view.extension.test"] div.monaco-tree-row:nth-child(${nodeNumber}) a.label-name:nth-child(1n)`);
});
When('I stop the tests', async () => {
    const selector = 'div[id="workbench.parts.sidebar"] a[title="Stop"]';
    await context.app.code.waitAndClick(selector);
});
Then('stop the tests', async () => {
    await stopRunningTests();
});
export async function killRunningTests() {
    try {
        const selector = 'div[id="workbench.parts.sidebar"] a[title="Stop"]';
        await context.app.code.waitForElement(selector, undefined, 1, 100);
    } catch {
        return;
    }
    try {
        await stopRunningTests();
    } catch {
        noop();
    }
}
async function stopRunningTests() {
    const selector = 'div[id="workbench.parts.sidebar"] a[title="Stop"]';
    await context.app.code.waitAndClick(selector);
}
When('I click first code lens "Run Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(2) a:nth-child(1)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.contain('Run Test');
    await context.app.code.waitAndClick(selector);
});

When('I click first code lens "Debug Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(2) a:nth-child(3)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.contain('Debug Test');
    await context.app.code.waitAndClick(selector);
});

When('I click second code lens "Debug Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(3) a:nth-child(3)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.contain('Debug Test');
    await context.app.code.waitAndClick(selector);
});

When('I click second code lens "Run Test"', async () => {
    const selector = 'div[id="workbench.editors.files.textFileEditor"] span.codelens-decoration:nth-child(3) a:nth-child(1)';
    const eles = await context.app.code.waitForElements(selector, true);
    expect(eles[0].textContent).to.contain('Run Test');
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
Then('expand test explorer tree', async () => {
    // We only want to support <= 15 nodes in testing.
    if (await getNodeCount() === 0) {
        return;
    }
    await selectNode(1);
    for (let nodeNumber = 1; nodeNumber < 50; nodeNumber += 1) {
        const visibleNodes = await getNodeCount();
        let info: { expanded: boolean; hasChildren: boolean };
        try {
            info = await getNodeInfo(nodeNumber);
        } catch {
            return;
        }
        if (!info.hasChildren && nodeNumber > visibleNodes) {
            return;
        }
        if (nodeNumber === 1 && info.expanded && info.hasChildren) {
            await context.app.code.dispatchKeybinding('down');
            continue;
        }
        if (!info.expanded && info.hasChildren) {
            await context.app.code.dispatchKeybinding('right');
            await context.app.code.dispatchKeybinding('down');
            continue;
        }
        if (!info.hasChildren) {
            await context.app.code.dispatchKeybinding('down');
            continue;
        }
    }
});

async function highlightNode(number: number): Promise<void> {
    // We only want to support <= 15 nodes in testing.
    if (await getNodeCount() === 0) {
        return;
    }
    await selectNode(1);
    for (let nodeNumber = 1; nodeNumber < 50; nodeNumber += 1) {
        if (nodeNumber === number) {
            return;
        }
        const visibleNodes = await getNodeCount();
        let info: { expanded: boolean; hasChildren: boolean };
        try {
            info = await getNodeInfo(nodeNumber);
        } catch {
            return;
        }
        if (!info.hasChildren && nodeNumber > visibleNodes) {
            return;
        }
        if (nodeNumber === 1 && info.expanded && info.hasChildren) {
            await context.app.code.dispatchKeybinding('down');
            continue;
        }
        if (!info.expanded && info.hasChildren) {
            await context.app.code.dispatchKeybinding('right');
            await context.app.code.dispatchKeybinding('down');
            continue;
        }
        await context.app.code.dispatchKeybinding('down');
    }
}
async function getNodeCount(): Promise<number> {
    const elements = await context.app.code.waitForElements('div[id="workbench.view.extension.test"] .tree-explorer-viewlet-tree-view div.monaco-tree-row', true, undefined, 1, 100);
    return elements.length;
}
async function selectFirstNode(): Promise<void> {
    await context.app.code.waitAndClick('div[id="workbench.view.extension.test"] div.monaco-tree-row:nth-child(1)');
}
async function selectNode(number: number): Promise<void> {
    if (number === 1) {
        return selectFirstNode();
    }
}
async function getNodeInfo(number: number): Promise<{ expanded: boolean; hasChildren: boolean }> {
    const element = await context.app.code.waitForElement(`div[id="workbench.view.extension.test"] div.monaco-tree-row:nth-child(${number})`, undefined, 1, 100);
    return {
        expanded: element.className.indexOf('expanded') >= 0,
        hasChildren: element.className.indexOf('has-children') >= 0
    };
}
