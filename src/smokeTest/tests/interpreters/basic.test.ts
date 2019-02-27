// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { Application } from '../../application';
import { getDisplayPath, selectGenericInterpreter, selectInterpreter } from './helper';

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
        it('Existing value in package.json', async () => {
            await app.workbench.quickopen.openFile('settings.json');
            await waitForIntrepreterInfoToGetRefreshed();

            const tooltip = getDisplayPath(app.activeEnvironment.pythonPath!, app.workspacePathOrFolder);
            const text = await app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
            app.activeEnvironment.displayNameParts.forEach(item => assert.notEqual(text.indexOf(item), -1, `'${item}' not found in display name`));
        });
        it('Select from list', async () => {
            await selectGenericInterpreter(app);
            const tooltip = getDisplayPath(app.activeEnvironment.pythonPath!, app.workspacePathOrFolder);
            await selectInterpreter(tooltip, app, undefined);
            await waitForIntrepreterInfoToGetRefreshed();

            const text = await app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
            app.activeEnvironment.displayNameParts.forEach(item => assert.notEqual(text.indexOf(item), -1, `'${item}' not found in display name`));
        });
    });
}
