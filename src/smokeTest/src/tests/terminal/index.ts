// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { setup as activationTestSetup } from './activation.test';
import { setup as execTestSetup } from './exec.test';

// tslint:disable:max-func-body-length no-invalid-this
export function setupTerminalTestsNoReload() {
    describe('Terminal', () => {
        activationTestSetup();
        execTestSetup();
    });
}
