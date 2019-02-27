// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Application } from '../../application';
import { progressMessageToDisappear } from './helper';

// tslint:disable:max-func-body-length no-invalid-this
export function setup() {
    describe('Progress', () => {
        let app!: Application;
        before(async function () {
            app = this.app as Application;
        });
        it('Status progress displayed and hidden after activation', async () => {
            await app.reload();
            await progressMessageToDisappear(app);
        });
    });
}
