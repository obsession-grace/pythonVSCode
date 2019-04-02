// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// Custom reporter to ensure Mocha process exits when we're done with tests.
// This is a hack, however for some reason the process running the tests do not exit.
// The hack is to force it to die when tests are done, if this doesn't work we've got a bigger problem on our hands.

// tslint:disable:no-var-requires no-require-imports no-any no-console no-unnecessary-class
const log = require('why-is-node-running');
const wtf = require('wtfnode');
const mocha: any = require('mocha');
const { EVENT_RUN_BEGIN, EVENT_RUN_END } = mocha.Runner.constants;

export class ExitReporter {
    constructor(runner: any) {
        // const stats = runner.stats;
        runner
            .once(EVENT_RUN_BEGIN, () => {
                console.info('Start form custom PVSC Mocha Reporter.');
            })
            .once(EVENT_RUN_END, () => {
                console.info('Will Exit from custom PVSC Mocha Reporter.');
                log();
                wtf();
                // NodeJs generally waits for pending timeouts, however the process running Mocha
                // No idea why it times, out. Once again, this is a hack.
                // Solution (i.e. hack), lets add a timeout with a delay of 10 seconds,
                // & if this process doesn't die, lets kill it.
                function die() {
                    setTimeout(() => {
                        console.info('Exiting from custom PVSC Mocha Reporter.');
                        log();
                        wtf();
                        // process.exit(stats.failures === 0 ? 0 : 1);
                        // try {
                        //     // Lets just close VSC, hopefully that'll be sufficient (more graceful).
                        //     const vscode = require('vscode');
                        //     vscode.commands.executeCommand('workbench.action.closeWindow');
                        // } catch (ex) {
                        //     // Do nothing.
                        // }
                    }, 30000);
                }
                die();
            });
    }
}
