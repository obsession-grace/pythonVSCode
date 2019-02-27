// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import * as path from 'path';
import { Application } from '../../application';
import { getSetting, removeSetting } from '../../helpers/settings';
import { EnvironmentType, VenvEnviroment } from '../../setup/config';
import { waitForExtensionToActivate } from '../activation/helper';
import { createVenv, deleteVenvs } from './helper';

// tslint:disable:max-func-body-length no-invalid-this no-any
export function setup() {
    describe('Venv', () => {
        let app!: Application;
        before(async function () {
            app = this.app as Application;
            if (app.activeEnvironment.type !== EnvironmentType.venv) {
                return this.skip();
            }
        });
        it('Detect created venv', async () => {
            await removeSetting('python.pythonPath', app.workspacePathOrFolder);
            await deleteVenvs(app);
            await app.reload();
            await waitForExtensionToActivate(app);

            // Ensure no local ven is auto selected.
            let pythonPathInSettings = await getSetting<string>('python.pythonPath', app.workspacePathOrFolder);
            assert.equal(pythonPathInSettings, undefined, 'Python Environment should not be auto selected before creating venv');

            await createVenv(app.activeEnvironment as VenvEnviroment, app);
            await app.reload();
            await waitForExtensionToActivate(app);

            pythonPathInSettings = await getSetting<string>('python.pythonPath', app.workspacePathOrFolder);
            assert.equal(path.dirname(path.resolve(app.workspacePathOrFolder, pythonPathInSettings)), path.dirname(app.activeEnvironment.pythonPath!));
        });
        it('Auto-select existing venv', async () => {
            await removeSetting('python.pythonPath', app.workspacePathOrFolder);
            await app.reload();
            await waitForExtensionToActivate(app);

            const pythonPathInSettings = await getSetting<string>('python.pythonPath', app.workspacePathOrFolder);
            assert.equal(path.dirname(path.resolve(app.workspacePathOrFolder, pythonPathInSettings)), path.dirname(app.activeEnvironment.pythonPath!));
        });

    });
}
