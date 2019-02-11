// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

export class StopWatch {
    private started: number = Date.now();
    public get elapsedTime() {
        return Date.now() - this.started;
    }
    public reset() {
        this.started = Date.now();
    }
    public log(message: string): void {
        console.log(`${this.elapsedTime}: ${message}`);
    }
}
