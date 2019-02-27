// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Application } from '../../application';
import { sleep } from '../../helpers';
import { getOSType, OSType } from '../../helpers/os';
import { updateSetting } from '../../helpers/settings';

// tslint:disable:max-func-body-length no-invalid-this no-any
export function setup() {
    describe('Mac', () => {
        let app!: Application;
        before(async function () {
            app = this.app as Application;
            if (getOSType() !== OSType.OSX || (app as any).macTestRan) {
                return this.skip();
            }
        });
        after(async () => {
            (app as any).macTestRan = true;
            await updateSetting('python.pythonPath', app.activeEnvironment.pythonPath!, app.workspacePathOrFolder);
        });
        it('Warn about python 2.7 on mac', async () => {
            await updateSetting('python.pythonPath', '/usr/bin/python', app.workspacePathOrFolder);
            await app.workbench.quickinput.waitForMessage('You have selected the macOS system install of Python');
            try {
                await sleep(100);
                await app.code.waitAndClick('.action-label.icon.clear-notification-action');
                await sleep(100);
                await app.code.waitAndClick('.action-label.icon.clear-notification-action');
                await sleep(100);
            } catch {
                // Do nothing.
            }
        });
    });
}
