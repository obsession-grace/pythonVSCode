// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Given } from 'cucumber';
import { removeSetting, updateSetting } from '../helpers/settings';
import { context } from './app';

// tslint:disable: no-any

Given('the setting {string} is enabled', async (setting: string) => {
    await updateSetting(setting as any, true, context.app.workspacePathOrFolder);
});
Given('the setting {string} is not enabled', async (setting: string) => {
    await updateSetting(setting as any, false, context.app.workspacePathOrFolder);
});
Given('the setting {string} is {string}', async (setting: string, value: string) => {
    await updateSetting(setting as any, value, context.app.workspacePathOrFolder);
});
Given('the setting {string} does not exist', async (setting: string) => {
    await removeSetting(setting as any, context.app.workspacePathOrFolder);
});
Given('the setting {string} is not set', async (setting: string) => {
    await removeSetting(setting as any, context.app.workspacePathOrFolder);
});
