// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Then, When } from 'cucumber';
import { sleep } from '../helpers';
import { waitForExtensionToActivate } from '../tests/activation/helper';
import { context } from './app';

Then('wait for {int} milliseconds', async (ms: number) => {
    await sleep(ms);
});

Then('wait for {int} {word}', async (seconds: number, _word: string) => {
    await sleep(seconds * 1000);
});

Then('take a screenshot', async () => {
    await sleep(500);
    await context.app.captureScreenshot(`something_${new Date().getTime().toString()}`);
});

Then('log message {string}', async (message: string) => {
    console.info(message);
});

When('I reload vscode', async () => {
    await context.app.reload();
    await waitForExtensionToActivate(context.app);
});
