// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { EventEmitter } from 'events';
import { context } from '../steps/app';

// tslint:disable: no-default-export

export default class CustomFormatter {
    constructor(private readonly options: { eventBroadcaster: EventEmitter }) {
        this.addHandlers();
    }
    private addHandlers() {
        this.options.eventBroadcaster.on('test-case-prepared', this.takeScreenshot.bind(this, 'test-case-prepared'));
        this.options.eventBroadcaster.on('test-step-finished', this.takeScreenshot.bind(this, 'test-step-prepared'));
        this.options.eventBroadcaster.on('test-case-finished', this.takeScreenshot.bind(this, 'test-case-finished'));
    }
    private async takeScreenshot(phase: string): Promise<void> {
        await context.app.captureScreenshot('test-case-prepared')
            .catch(() => {
                console.error(`Failed to capture automatic screenshot during ${phase}`);
            });
    }
}
