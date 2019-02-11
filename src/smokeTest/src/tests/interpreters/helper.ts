// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as util from 'util';
import { Application } from '../../application';
import { sleep } from '../../helpers';
import { getOSType, OSType } from '../../helpers/os';
import { updateSetting } from '../../helpers/settings';
import { EnvironmentType, PipEnvEnviroment, VenvEnviroment } from '../../setup/config';
import { fileToCommandArgument, toCommandArgument } from '../../setup/utils';
import { waitForExtensionToActivate } from '../activation/helper';

// tslint:disable-next-line: no-var-requires no-require-imports
const untildify = require('untildify');

const home = untildify('~');

export function getDisplayPath(pathValue: string, cwd?: string): string {
    if (cwd && pathValue.startsWith(cwd)) {
        return `.${path.sep}${path.relative(cwd, pathValue)}`;
    } else if (pathValue.startsWith(home)) {
        return `~${path.sep}${path.relative(home, pathValue)}`;
    } else {
        return pathValue;
    }
}

export async function selectGenericInterpreter(app: Application, noWait: boolean = false): Promise<void> {
    await updateSetting('python.pythonPath', app.configuration.genericPyhtonPath, app.workspacePathOrFolder);
    if (noWait) {
        return;
    }
    const tooltip = getDisplayPath(app.configuration.genericPyhtonPath, app.workspacePathOrFolder);
    await app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
}

export async function selectInterpreter(tooltip: string, app: Application, name?: string, displayName?: string): Promise<void> {
    await app.workbench.quickopen.openFile('settings.json');
    await app.workbench.quickopen.runCommand('Python: Select Interpreter');

    await sleep(100);
    await app.captureScreenshot('Interpreter List');
    await sleep(100);
    await app.workbench.quickinput.waitForInterpreterInput();
    const selectionFilter = displayName || tooltip;
    await app.workbench.quickinput.submitInterpreterInput(selectionFilter);
    await app.workbench.statusbar.waitForStatusbarLinkText(tooltip, name);
}

export async function createPipEnv(environment: PipEnvEnviroment, app: Application): Promise<string> {
    const pipEnvPath = environment.pipEnvPath ? environment.pipEnvPath : 'pipenv';
    const pipEnvArgs = Array.isArray(environment.pipEnvArgs) ? environment.pipEnvArgs : [];
    const runPyFileArg = `"python ${toCommandArgument(path.join(app.workspacePathOrFolder, 'runInTerminal.py')).replace(/\"/g, '\\"')}"`;
    const command = [fileToCommandArgument(pipEnvPath), 'shell', '--anyway', ...pipEnvArgs, runPyFileArg].join(' ');
    await app.workbench.quickopen.runCommand('Terminal: Create New Integrated Terminal');
    await app.workbench.terminal.runCommand(command);
    const folderName = path.basename(app.workspacePathOrFolder);
    environment.displayNameParts.push(folderName);

    // When a te3rminal has been created, the environment will be activated and displayed as `(<folderName>)`.
    const predicateCreated = (buffer: string[]) => {
        if (buffer.some(line => line.startsWith(`(${folderName.replace(/ /g, '_')}`))) {
            return true;
        }
        return false;
    };
    try {
        await app.workbench.terminal.waitForTerminalText(predicateCreated);
    } finally {
        await app.workbench.terminal.closeTerminal();
    }
    environment.pipEnvPythonPath = await fs.readFile(path.join(app.workspacePathOrFolder, 'output.log'), 'utf-8');
    return environment.pipEnvPythonPath;
}
export async function createVenv(environment: VenvEnviroment, app: Application): Promise<string> {
    const basePythonPath = environment.venvBasePythonPath ? environment.venvBasePythonPath : 'python3';
    const venvArgs = Array.isArray(environment.venvArgs) ? environment.venvArgs : ['venv'];
    const venvName = venvArgs[0];
    environment.displayNameParts.push(venvName);
    const command = [fileToCommandArgument(basePythonPath), '-m', 'venv', ...venvArgs.map(toCommandArgument)].join(' ');
    const environmentCreatedMessage = 'Environment Created';

    await app.workbench.quickopen.runCommand('Terminal: Create New Integrated Terminal');
    await app.workbench.terminal.runCommand(`${command} && echo '${environmentCreatedMessage}'`);

    // When a te3rminal has been created, the environment will be activated and displayed as `(<folderName>)`.
    const predicateCreated = (buffer: string[]) => {
        if (buffer.some(line => line.startsWith(environmentCreatedMessage))) {
            return true;
        }
        return false;
    };
    try {
        await app.workbench.terminal.waitForTerminalText(predicateCreated);
    } finally {
        await app.workbench.terminal.closeTerminal();
    }
    const pythonPath = getOSType() === OSType.Windows ? path.join(app.workspacePathOrFolder, venvName, 'scripts', 'python.exe') :
        path.join(app.workspacePathOrFolder, venvName, 'bin', 'python');

    if (!(await fs.pathExists(pythonPath))) {
        throw new Error('Unable to determine python path of venv');
    }
    environment.venvPythonPath = pythonPath;
    return pythonPath;
}

export async function deletePipEnv(app: Application): Promise<void> {
    const environment = app.configuration.environments.find(env => env.type === EnvironmentType.pipenv) as PipEnvEnviroment;
    if (!environment) {
        return;
    }
    const pipEnvPath = environment.pipEnvPath ? environment.pipEnvPath : 'pipenv';
    const command = [fileToCommandArgument(pipEnvPath), '--rm'].join(' ');
    await app.workbench.quickopen.runCommand('Terminal: Create New Integrated Terminal');
    await app.workbench.terminal.runCommand(command);
    // await sleep(5_000);

    // When pipenv is removed the text `Removing` will be displayed in terminal.
    const predicate = (buffer: string[]) => {
        const removingText = 'Removing';
        const noText = 'No virtualenv';
        if (buffer.some(line => line.startsWith(removingText) || line.startsWith(noText))) {
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
export async function deleteVenvs(app: Application): Promise<void> {
    const globToDelete = path.join(app.workspacePathOrFolder, 'venv*');
    await util.promisify(rimraf)(globToDelete);
}
export async function getPythonInterpreterPath(pythonPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const cmds = [
            fileToCommandArgument(pythonPath),
            '-c',
            '"import sys;print(sys.executable)"'
        ];
        exec(cmds.join(' '), (ex, stdout, stdErr) => {
            if (ex) {
                return reject(ex);
            }
            if (stdErr) {
                return reject(new Error(stdErr));
            }
            resolve(stdout.trim());
        });
    });
}

/**
 * Display names in status bar may not refresh immediately.
 * E.g. in the case of conda this is quite slow, we might have to wait for some time
 * & optionally reload vsc.
 *
 * @export
 * @param {Application} app
 * @returns
 */
export async function reloadToRefreshCondaDisplayNames(app: Application) {
    async function isDisplayNameCorrect() {
        const tooltip = getDisplayPath(app.activeEnvironment.pythonPath!, app.workspacePathOrFolder);
        const text = await app.workbench.statusbar.waitForStatusbarLinkText(tooltip);
        return !app.activeEnvironment.displayNameParts.some(item => text.indexOf(item) === -1);
    }
    for (let i = 0; i < 4; i += 1) {
        const found = await isDisplayNameCorrect();
        if (found) {
            return;
        }
        await sleep(5_000);
        if ((i % 2) === 0) {
            continue;
        }
        await app.reload();
        await waitForExtensionToActivate(app);
    }
}
