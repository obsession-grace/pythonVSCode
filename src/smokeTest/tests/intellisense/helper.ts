// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { Application } from '../../application';
import { sleep } from '../../helpers';

export async function waitForJediOrLSToActivate(app: Application) {
    await app.workbench.quickopen.runCommand('Python: Show Output');
    await sleep(500);

    const selector = '.part.panel.bottom .lines-content.monaco-editor-background .view-lines';
    for (let i = 0; i < 10; i += 1) {
        let ele = await app.code.waitForElement(selector);
        if (ele.textContent.length === 0 || ele.textContent.indexOf('Starting') === -1) {
            await sleep(1_000);
            continue;
        }
        if (!app.isJedi && ele.textContent.indexOf('Initializing') === -1) {
            await sleep(1_000);
            continue;
        }
        ele = await app.code.waitForElement(selector);
        const words = app.isJedi ? [...'Starting Jedi Python language engine'.split(' ')] : [
            ...'Starting Microsoft Python language server'.split(' '),
            ...'Microsoft Python Language Server version'.split(' '),
            ...'Initializing for'.split(' ')
        ];
        words.forEach(word => assert.notEqual(ele.textContent.indexOf(word), -1));
        break;
    }
    await sleep(app.isJedi ? 5000 : 1000);
}
