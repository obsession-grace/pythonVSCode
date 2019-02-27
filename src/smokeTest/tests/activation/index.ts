// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { noop } from '../../helpers';
import { setup as basicTestSetup } from './helper';

export function setupActivationTestsNoReload() {
    noop();
}
export function setupActivationTestsWithReload() {
    describe('Extension Activation', () => {
        basicTestSetup();
    });
}
