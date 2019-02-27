// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { appendFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { format } from 'util';

// tslint:disable:no-any no-console
export interface ILogger {
    log(message: string, ...args: any[]): void;
}

export class ConsoleLogger implements ILogger {

    public log(message: string, ...args: any[]): void {
        console.log('**', message, ...args);
    }
}

export class FileLogger implements ILogger {

    constructor(private path: string) {
        writeFileSync(path, '');
    }

    public log(message: string, ...args: any[]): void {
        const date = new Date().toISOString();
        appendFileSync(this.path, `[${date}] ${format(message, ...args)}${EOL}`);
    }
}

export class MultiLogger implements ILogger {

    constructor(private loggers: ILogger[]) { }

    public log(message: string, ...args: any[]): void {
        for (const logger of this.loggers) {
            logger.log(message, ...args);
        }
    }
}
