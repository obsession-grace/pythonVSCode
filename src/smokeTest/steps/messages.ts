// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Then } from 'cucumber';
import { closeMessages } from '../helpers/messages';

Then('close notifications', async () => {
    await closeMessages();
});
