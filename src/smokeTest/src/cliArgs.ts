// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as minimist from 'minimist';
const args: minimist.ParsedArgs = minimist(process.argv.slice(2));

export const cliArgs: ICliArgs = {
    ...args,
    logLevel: 'one',
    rawCommandLine: process.argv.join(' ')
};

export interface ICliArgs extends minimist.ParsedArgs {
    logLevel: 'one' | 'two';
    rawCommandLine: string;
}
