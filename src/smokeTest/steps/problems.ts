// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { Given, Then, When } from 'cucumber';
import { Problems, ProblemSeverity } from '../areas/problems/problems';
import { context } from './app';

const mapping = new Map<string, number>([
    ['error', ProblemSeverity.ERROR],
    ['errors', ProblemSeverity.ERROR],
    ['warning', ProblemSeverity.WARNING],
    ['warnings', ProblemSeverity.WARNING]
]);

async function checkProblems(count: number, category: 'error' | 'warning' | 'errors' | 'warnings') {
    const elements = await context.app.code.waitForElements(Problems.getSelectorInProblemsView(mapping.get(category)!), true);
    assert.equal(elements.length, count);
}
// Then('there {word} {int} {word} in the problems panel', async (_isOare: string | 'is' | 'are', count: number, category: string | 'error' | 'warning' | 'errors' | 'warnings') => {
Then('there {word} {int} {word} in the problems panel', async (_isOare: string, count: number, category: string) => {
    // tslint:disable-next-line:no-any
    await checkProblems(count, category as any);
});
Then('there {word} {int} {word}', async (_isOare: 'is' | 'are', count: number, _problem: 'problem' | 'problems') => {
    const element = await context.app.code.waitForElement(Problems.getSelectorForProblemCount());
    const strCount = (element.textContent || '').trim().length === 0 ? '0' : element.textContent;
    assert.equal(parseInt(strCount, 10), count);
});
When('I open the problems panel', async () => {
    await context.app.workbench.quickopen.runCommand('View: Focus Problems (Errors, Warnings, Infos)');
    // await context.app.workbench.problems.showProblemsView();
});
Given('the problems panel is open', async () => {
    await context.app.workbench.quickopen.runCommand('View: Focus Problems (Errors, Warnings, Infos)');
    // await context.app.workbench.problems.showProblemsView();
});
// Then('there is {word} {word} with the message {string} in the problems panel', async (_aOran: 'a' | 'an', category: 'error' | 'warning', problem: string) => {
Then('there is {word} {word} with the message {string} in the problems panel', async (_aOran: string, category: string, problem: string) => {
    const elements = await context.app.code.waitForElements(Problems.getSelectorInProblemsViewForMessage(mapping.get(category)!), true);
    const item = elements.find(ele => ele.textContent === problem);
    assert.notEqual(item, undefined, `Problem '${problem}' not found!`);
});
