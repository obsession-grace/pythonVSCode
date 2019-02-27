// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { Application } from '../../application';
import { sleep } from '../../helpers';
import { updateSetting } from '../../helpers/settings';
import { waitForExtensionToActivate } from '../activation/helper';
import { getDisplayPath, selectGenericInterpreter } from './helper';

// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    describe('Basic', () => {
        let app!: Application;
        before(async function () {
            app = this.app as Application;
        });
        async function waitForIntrepreterInfoToGetRefreshed() {
            // await sleep(100);
        }
        it('Update package.json after loading vsc', async () => {
            await selectGenericInterpreter(app, true);
            await app.reload();
            // Hopefully event handlers will be setup in 2s (to detect changes to settings.json).
            await Promise.race([waitForExtensionToActivate(app), sleep(2000)]);

            await app.workbench.quickopen.openFile('main.py');
            await app.workbench.quickopen.openFile('settings.json');
            await updateSetting('python.pythonPath', app.activeEnvironment.pythonPath!, app.workspacePathOrFolder);
            await waitForIntrepreterInfoToGetRefreshed();

            const tooltip = getDisplayPath(app.activeEnvironment.pythonPath!, app.workspacePathOrFolder);
            const text = await app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
            app.activeEnvironment.displayNameParts.forEach(item => assert.notEqual(text.indexOf(item), -1, `'${item}' not found in display name`));
        });
    });
}
