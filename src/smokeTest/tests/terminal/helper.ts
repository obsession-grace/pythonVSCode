// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Application } from '../../application';

export async function fileWillRunInActivatedEnvironment(app: Application) {
    await app.workbench.quickopen.openFile('runInTerminal.py');
    await app.workbench.quickopen.runCommand('Python: Run Python File in Terminal');
    await app.workbench.terminal.waitForTerminalText((lines: string[]) => lines.indexOf('Done') >= 0);
    await app.workbench.terminal.closeTerminal();
    const logFile = path.join(app.workspacePathOrFolder, 'output.log');
    const output = fs
        .readFileSync(logFile)
        .toString()
        .trim();
    assert.equal(output, app.activeEnvironment.pythonPath!);
}

export async function runEditorLineInTerminal(app: Application) {
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
}
