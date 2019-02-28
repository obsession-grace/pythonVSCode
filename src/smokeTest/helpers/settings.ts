// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as stripJsonComments from 'strip-json-comments';

type Setting = 'python.pythonPath' |
    'python.terminal.activateEnvironment' |
    'python.jediEnabled' |
    'python.unitTest.nosetestsEnabled' |
    'python.unitTest.pyTestEnabled' |
    'python.unitTest.unittestEnabled';

type DebugSetting = 'stopOnEntry';

export async function removeSetting(setting: Setting, workspaceFolder: string): Promise<void> {
    const settings = await getSettingsJson(workspaceFolder);
    if (settings[setting] === undefined) {
        return;
    }
    delete settings[setting];
    await updateSettingsJson(settings, workspaceFolder);
}
export async function updateSetting(setting: Setting, value: string | boolean | number, workspaceFolder: string): Promise<void> {
    const settings = await getSettingsJson(workspaceFolder);
    if (settings[setting] === value) {
        return;
    }
    settings[setting] = value;
    await updateSettingsJson(settings, workspaceFolder);
}

export async function updateDebugConfiguration(setting: DebugSetting, value: string | boolean | number, workspaceFolder: string, debugConfiugrationIndex: number): Promise<void> {
    const settings = await getLaunchJson(workspaceFolder);
    if (settings['configurations'][0][setting] === value) {
        return;
    }
    settings['configurations'][0][setting] = value;
    await updateLaunchJson(settings, workspaceFolder);
}

export async function getSetting<T>(setting: Setting, workspaceFolder: string): Promise<T> {
    const settings = await getSettingsJson(workspaceFolder);
    return settings[setting] as T;
}

/**
 * We might use this same code to update user settings.
 *
 * @param {string} folder
 * @returns
 */
async function getJsonFilePath(fileName: string, folder: string) {
    let jsonFile = path.join(folder, fileName);
    if (!(await fs.pathExists(jsonFile))) {
        return path.join(folder, '.vscode', fileName);
    }
    return jsonFile;
}

async function updateSettingsJson(settings: object, workspaceFolder: string): Promise<void> {
    const jsonFile = await getJsonFilePath('settings.json', workspaceFolder);
    await fs.writeFile(jsonFile, JSON.stringify(settings, undefined, 4));
}

async function getSettingsJson(workspaceFolder: string): Promise<object> {
    const jsonFile = await getJsonFilePath('settings.json', workspaceFolder);
    const jsonContent = await fs.readFile(jsonFile, 'utf8');
    const json = stripJsonComments(jsonContent);
    return JSON.parse(json);
}

async function updateLaunchJson(settings: object, workspaceFolder: string): Promise<void> {
    const jsonFile = await getJsonFilePath('launch.json', workspaceFolder);
    await fs.writeFile(jsonFile, JSON.stringify(settings, undefined, 4));
}

async function getLaunchJson(workspaceFolder: string): Promise<object> {
    const jsonFile = await getJsonFilePath('launch.json', workspaceFolder);
    const jsonContent = await fs.readFile(jsonFile, 'utf8');
    const json = stripJsonComments(jsonContent);
    return JSON.parse(json);
}
