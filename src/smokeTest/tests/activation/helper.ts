// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { Application } from '../../application';
import { noop, sleep } from '../../helpers';
import { waitForJediOrLSToActivate } from '../intellisense/helper';
import * as fs from 'fs-extra';
import * as path from 'path';

// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    noop();
}

export async function progressMessageToDisappear(app: Application) {
    await fs.writeFile(path.join(app.workspacePathOrFolder, 'main.py'), '');
    await sleep(500);
    await app.workbench.quickopen.openFile('main.py');

    const tooltip = '[Python (Extension)]: Python extension loading...';
    await app.workbench.statusbar.waitForStatusbarText(tooltip);

    const mainSelector = app.workbench.statusbar.mainSelector;

    const maxTimeInSecs = 30;
    // Wait for a max of 30s for extension to activate.
    let timedout = false;
    for (let i = 0; i < maxTimeInSecs; i += 1) {
        timedout = await app.code.waitForElement(`${mainSelector} span[title="${tooltip}"]`, undefined, 1).then(() => false).catch(() => true);
        if (timedout) {
            break;
        }
        await sleep(1000);
    }
    if (!timedout) {
        assert.fail(`Extension did not activate in ${maxTimeInSecs}s`);
    }
    await fs.unlink(path.join(app.workspacePathOrFolder, 'main.py'));
}
export async function waitForExtensionToActivate(app: Application) {
    await progressMessageToDisappear(app);
    await waitForJediOrLSToActivate(app);
}
