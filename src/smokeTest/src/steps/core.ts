// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Then } from 'cucumber';
import { sleep } from '../helpers';
import { context } from './app';

Then('wait for {int} milliseconds', async (ms: number) => {
    await sleep(ms);
});

Then('take a screenshot', async () => {
    await context.app.captureScreenshot(`something_${new Date().getTime().toString()}`);
});

Then('log message {string}', async (message: string) => {
    console.info(message);
});
