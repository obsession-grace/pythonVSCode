// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { promisify } from 'util';
import { Application } from '../../application';
import { sleep } from '../../helpers';
import { updateSetting } from '../../helpers/settings';
import { EnvironmentType } from '../../setup/config';

// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    describe('Exec', () => {
        let app!: Application;
        let logFile!: string;
        before(async function () {
            app = this.app as Application;
            if (app.activeEnvironment.type !== EnvironmentType.conda &&
                app.activeEnvironment.type !== EnvironmentType.pipenv &&
                app.activeEnvironment.type !== EnvironmentType.venv &&
                app.activeEnvironment.type !== EnvironmentType.virtualenv) {
                return this.skip();
            }
            logFile = path.join(app.workspacePathOrFolder, 'output.log');
            await promisify(rimraf)(logFile);
            await updateSetting('python.terminal.activateEnvironment', true, app.workspacePathOrFolder);
            await sleep(100);
        });
        it('Runs file in terminal', async () => {
            await app.workbench.quickopen.openFile('runInTerminal.py');
            await app.workbench.quickopen.runCommand('Python: Run Python File in Terminal');
            await app.workbench.terminal.waitForTerminalText((lines: string[]) => lines.indexOf('Done') >= 0);
            await app.workbench.terminal.closeTerminal();
            const output = fs
                .readFileSync(logFile)
                .toString()
                .trim();
            assert.equal(output, app.activeEnvironment.pythonPath!);
        });
        it('Runs line in terminal (command)', async () => {
            await app.workbench.quickopen.openFile('runSelection.py');
            await app.workbench.editor.waitForEditorFocus('runSelection.py', 1);
            await app.code.dispatchKeybinding('down');
            await app.workbench.quickopen.runCommand('Python: Run Selection/Line in Python Terminal');
            const predicate = (buffer: string[]) => {
                const line1 = 'Hello World!';
                const line2 = 'And hello again!';
                if (!buffer.some(line => line.indexOf(line1) >= 0) &&
                    buffer.some(line => line.indexOf(line2) >= 0)) {
                    return true;
                }
                return false;
            };
            try {
                await app.workbench.terminal.waitForTerminalText(predicate);
            } finally {
                await app.workbench.terminal.closeTerminal();
            }
        });
        it('Runs line in terminal (shift+enter)', async () => {
            await app.workbench.quickopen.openFile('runSelection.py');
            await app.workbench.editor.waitForEditorFocus('runSelection.py', 1);
            await app.code.dispatchKeybinding('down');
            await app.code.dispatchKeybinding('shift+enter');
            const predicate = (buffer: string[]) => {
                const line1 = 'Hello World!';
                const line2 = 'And hello again!';
                if (!buffer.some(line => line.indexOf(line1) >= 0) &&
                    buffer.some(line => line.indexOf(line2) >= 0)) {
                    return true;
                }
                return false;
            };
            try {
                await app.workbench.terminal.waitForTerminalText(predicate);
            } finally {
                await app.workbench.terminal.closeTerminal();
            }
        });
        it('Runs selection in terminal', async () => {
            await app.workbench.quickopen.openFile('runSelection.py');
            await app.workbench.editor.waitForEditorFocus('runSelection.py', 1);
            await app.code.dispatchKeybinding('cmd+a');
            await app.workbench.quickopen.runCommand('Python: Run Selection/Line in Python Terminal');
            const predicate = (buffer: string[]) => {
                const line1 = 'Hello World!';
                const line2 = 'And hello again!';
                if (buffer.some(line => line.indexOf(line1) >= 0) &&
                    buffer.some(line => line.indexOf(line2) >= 0)) {
                    return true;
                }
                return false;
            };
            try {
                await app.workbench.terminal.waitForTerminalText(predicate);
            } finally {
                await app.workbench.terminal.closeTerminal();
            }
        });
    });
}
