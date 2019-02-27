// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { promisify } from 'util';
import { Application } from '../../application';

// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    describe('Interperter', () => {
        let app!: Application;
        before(function() {
            app = this.app as Application;
        });
        it('pipenv in status bar', async () => {
            await app.workbench.quickopen.openFile('main.py');

            const tooltip = '~/.local/share/virtualenvs/Blah-9RGIa5Ay/bin/python';
            const text = 'Python 3.6.6 64-bit (\'Blah\': pipenv)';
            await app.workbench.statusbar.waitForStatusbarLinkText(tooltip, text);
        });
        it('conda in status bar with manual update to launch.json', async () => {
            await app.workbench.quickopen.openFile('settings.json');

            const jsonFile = '/Users/donjayamanne/Desktop/Development/PythonStuff/Blah/.vscode/settings.json';
            const contents = fs.readFileSync(jsonFile).toString();
            const oldText =
                '"python.pythonPath": "/Users/donjayamanne/.local/share/virtualenvs/Blah-9RGIa5Ay/bin/python",';
            const newText = '"python.pythonPath": "/Users/donjayamanne/anaconda3/envs/env-01/bin/python",';
            const updatedText = contents.replace(oldText, newText);
            fs.writeFileSync(jsonFile, updatedText);

            const tooltip = '~/anaconda3/envs/env-01/bin/python';
            const text = 'Python 3.4.5 64-bit (\'env-01\': conda)';
            await app.workbench.statusbar.waitForStatusbarLinkText(tooltip, text);
        });
        async function selectInterpreter(tooltip: string, name: string, displayName: string) {
            await app.workbench.quickopen.openFile('settings.json');
            await app.workbench.quickopen.runCommand('Python: Select Interpreter');

            await new Promise(r => setTimeout(r, 100));
            await app.captureScreenshot('Interpreter List');
            await new Promise(r => setTimeout(r, 100));
            await app.workbench.quickinput.waitForInterpreterInput();
            await app.workbench.quickinput.submitInterpreterInput(displayName);

            await app.workbench.statusbar.waitForStatusbarLinkText(tooltip, name);
        }
        it('default python 2.7 on mac', async () => {
            const tooltip = '/usr/bin/python';
            const text = 'Python 2.7.10 64-bit';
            await selectInterpreter(tooltip, text, 'Python 2.7.10 64-bit');
            await app.workbench.quickinput.waitForMessage('You have selected the macOS system install of Python');
            await new Promise(r => setTimeout(r, 100));
            await app.code.waitAndClick('.action-label.icon.clear-notification-action');
            await new Promise(r => setTimeout(r, 1000));
            await app.code.waitAndClick('.action-label.icon.clear-notification-action');
            await new Promise(r => setTimeout(r, 1000));
        });
        it('PipEnv from list', async () => {
            const tooltip = '~/.local/share/virtualenvs/Blah-9RGIa5Ay/bin/python';
            const text = 'Python 3.6.6 64-bit (\'Blah\': pipenv)';
            await selectInterpreter(tooltip, text, 'blah pipenv');
            await app.workbench.statusbar.waitForStatusbarLinkText(tooltip, text);
        });
    });
    describe('Terminal Activation', () => {
        let app!: Application;
        before(function() {
            app = this.app as Application;
        });

        const interpreters = [
            [
                '~/.local/share/virtualenvs/Blah-9RGIa5Ay/bin/python',
                '/Users/donjayamanne/.local/share/virtualenvs/Blah-9RGIa5Ay/bin/python',
                'pipenv',
                5000
            ],
            ['~/anaconda3/envs/py27/bin/python', '/Users/donjayamanne/anaconda3/envs/py27/bin/python', 'conda', 5000],
            [
                './venv/bin/python',
                '/Users/donjayamanne/Desktop/Development/PythonStuff/Blah/venv/bin/python',
                'virtualenv',
                5000
            ]
        ];
        interpreters.forEach(item => {
            it(item[2] as string, async () => {
                const logFile = '/Users/donjayamanne/Desktop/Development/PythonStuff/Blah/output.log';
                const displayPath = item[0] as string;
                const interpreter = item[1] as string;
                await promisify(rimraf)(logFile);

                await app.workbench.quickopen.runCommand('Python: Select Interpreter');
                await app.workbench.quickinput.submitInterpreterInput(displayPath);
                await new Promise(r => setTimeout(r, 1000));
                await app.workbench.quickopen.runCommand('Terminal: Create New Integrated Terminal');
                await new Promise(r => setTimeout(r, item[3] as number));
                await app.workbench.terminal.runCommand('python runInTerminal.py');
                await new Promise(r => setTimeout(r, 1000));
                await app.workbench.terminal.closeTerminal();
                const output = fs
                    .readFileSync(logFile)
                    .toString()
                    .trim();
                assert.equal(output, interpreter);
            });
        });
    });
    describe('Debug', () => {
        let app!: Application;
        before(function() {
            app = this.app as Application;
        });
        it('configure launch.json', async () => {
            await app.workbench.debug.openDebugViewlet();
            await app.workbench.quickopen.openFile('main.py');
            await app.workbench.debug.configure();
        });
        it('breakpoints', async () => {
            await app.workbench.quickopen.openFile('main.py');
            await app.workbench.debug.setBreakpointOnLine(5);
            await app.workbench.quickopen.runCommand('View: Toggle Integrated Terminal');
        });

        it('start debugging', async () => {
            await app.workbench.debug.startDebugging('Application launched successfully');
            app.captureScreenshot('Started Debugging');
        });

        it('focus stack frames and variables', async () => {
            await app.workbench.debug.waitForVariableCount(1);
            await app.workbench.debug.focusStackFrame('main.py', 'looking for main.py');
        });
        it('stepOver, stepIn, stepOut', async () => {
            await app.workbench.debug.stepOver();
            const first = await app.workbench.debug.waitForStackFrame(
                sf => /main\.py$/.test(sf.name),
                'looking for main.py'
            );
            app.captureScreenshot('Breakpoints');
            await app.workbench.debug.stepOver();
            await app.workbench.debug.waitForStackFrame(
                sf => /main\.py$/.test(sf.name) && sf.lineNumber === first.lineNumber + 1,
                `looking for main.py and line ${first.lineNumber + 1}`
            );
            await app.workbench.debug.stepOut();

            await app.workbench.debug.waitForStackFrame(sf => /main\.py$/.test(sf.name), 'looking for main.py');
        });
        it('continue', async () => {
            await app.workbench.debug.continue();
        });
        it('stop debugging', async () => {
            await app.workbench.debug.stopDebugging();
        });
    });
}
