// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as tmp from 'tmp';
import { promisify } from 'util';
import * as util from 'util';
import { Application } from '../../application';
import { sleep } from '../../helpers';
import { updateSetting } from '../../helpers/settings';
import { EnvironmentType } from '../../setup/config';
import { toCommandArgument } from '../../setup/utils';

export async function getPythonPathInActiveTerminal(app: Application) {
    const logFile = path.join(app.workspacePathOrFolder, 'output.log');
    await util.promisify(rimraf)(logFile);
    await Promise.all([
        app.workbench.terminal.runCommand('python runInTerminal.py'),
        app.workbench.terminal.waitForTerminalText((lines: string[]) => lines.indexOf('Done') >= 0)
    ]);
    return fs
        .readFileSync(logFile)
        .toString()
        .trim();
}
// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    describe('Activation', () => {
        let app!: Application;
        before(async function () {
            app = this.app as Application;
            if (app.activeEnvironment.type !== EnvironmentType.conda &&
                app.activeEnvironment.type !== EnvironmentType.pipenv &&
                app.activeEnvironment.type !== EnvironmentType.venv &&
                app.activeEnvironment.type !== EnvironmentType.virtualenv) {
                return this.skip();
            }
        });
        it('Activates', async () => {
            const logFile = path.join(app.workspacePathOrFolder, 'output.log');
            await promisify(rimraf)(logFile);
            await updateSetting('python.terminal.activateEnvironment', true, app.workspacePathOrFolder);
            await sleep(100);
            await app.workbench.quickopen.runCommand('Terminal: Create New Integrated Terminal');
            await sleep(app.activeEnvironment.delayForActivation);
            await Promise.all([
                app.workbench.terminal.runCommand('python runInTerminal.py'),
                app.workbench.terminal.waitForTerminalText((lines: string[]) => lines.indexOf('Done') >= 0)
            ]);
            await app.workbench.terminal.closeTerminal();
            const output = fs
                .readFileSync(logFile)
                .toString()
                .trim();

            assert.equal(output, app.activeEnvironment.pythonPath!);
        });
        it('Does not activate', async () => {
            const logFile = path.join(app.workspacePathOrFolder, 'output.log');
            await promisify(rimraf)(logFile);
            await updateSetting('python.terminal.activateEnvironment', false, app.workspacePathOrFolder);
            await sleep(100);
            await app.workbench.quickopen.runCommand('Terminal: Create New Integrated Terminal');
            await sleep(app.activeEnvironment.delayForActivation);
            await Promise.all([
                app.workbench.terminal.runCommand('python runInTerminal.py'),
                app.workbench.terminal.waitForTerminalText((lines: string[]) => lines.indexOf('Done') >= 0)
            ]);
            await app.workbench.terminal.closeTerminal();
            const output = fs
                .readFileSync(logFile)
                .toString()
                .trim();
            assert.notEqual(output, app.activeEnvironment.pythonPath!);
        });
    });
}
