// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as stripJsonComments from 'strip-json-comments';

type Setting = 'python.pythonPath' |
    'python.terminal.activateEnvironment' |
    'python.jediEnabled';
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

export async function getSetting<T>(setting: Setting, workspaceFolder: string): Promise<T> {
    const settings = await getSettingsJson(workspaceFolder);
    return settings[setting] as T;
}

async function updateSettingsJson(settings: object, workspaceFolder: string): Promise<void> {
    const jsonFile = path.join(workspaceFolder, '.vscode', 'settings.json');
    await fs.writeFile(jsonFile, JSON.stringify(settings, undefined, 4));
}

async function getSettingsJson(workspaceFolder: string): Promise<object> {
    const jsonFile = path.join(workspaceFolder, '.vscode', 'settings.json');
    const jsonContent = await fs.readFile(jsonFile, 'utf8');
    const json = stripJsonComments(jsonContent);
    return JSON.parse(json);
}
