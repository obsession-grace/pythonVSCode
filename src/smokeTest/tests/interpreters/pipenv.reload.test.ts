// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import * as path from 'path';
import { Application } from '../../application';
import { getSetting, removeSetting } from '../../helpers/settings';
import { EnvironmentType } from '../../setup/config';
import { waitForExtensionToActivate } from '../activation/helper';
import { getDisplayPath } from './helper';

// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    describe('PipEnv', () => {
        let app!: Application;
        before(async function () {
            app = this.app as Application;
            if (app.activeEnvironment.type !== EnvironmentType.pipenv) {
                return this.skip();
            }
        });
        it('Auto-select existing Pipenv', async () => {
            await removeSetting('python.pythonPath', app.workspacePathOrFolder);
            await app.reload();
            await waitForExtensionToActivate(app);

            const pythonPath = app.activeEnvironment.pythonPath!;
            const tooltip = getDisplayPath(pythonPath, app.workspacePathOrFolder);

            const pythonPathInSettings = await getSetting<string>('python.pythonPath', app.workspacePathOrFolder);
            assert.equal(pythonPathInSettings, path.resolve(app.workspacePathOrFolder, pythonPath));

            const text = await app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
            app.activeEnvironment.displayNameParts.forEach(item => assert.notEqual(text.indexOf(item), -1, `'${item}' not found in display name`));
        });

    });
}
