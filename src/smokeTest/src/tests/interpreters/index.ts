// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { setup as basicReloadTestSetup } from './basic.reload.test';
import { setup as basicTestSetup } from './basic.test';
import { setup as macTestSetup } from './mac.test';
import { setup as pipEnvReloadTestSetup } from './pipenv.reload.test';
import { setup as venvReloadTestSetup } from './venv.reload.test';

export function setupInterpreterTestsNoReload() {
    describe('Interpreter', () => {
        basicTestSetup();
        macTestSetup();
    });
}
export function setupInterpreterTestsReload() {
    describe('Interpreter', () => {
        basicReloadTestSetup();
        pipEnvReloadTestSetup();
        venvReloadTestSetup();
    });
}
