// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as stripComments from 'strip-json-comments';
import { smokeTestExtensionDir } from './constants';
import { noop } from './helpers';
import { Configuration } from './setup/config';

//cucumber-js src/smokeTest/features/* -r source-map-support/register -r out/smokeTest/steps/**/*.js --format json:tmp/reports/cucumber-report.json --format summary --environment=0
const configContent = fs.readFileSync(path.join(smokeTestExtensionDir, 'src', 'smokeTest', 'testConfig.json')).toString();
const jsonContent = stripComments(configContent);
const configuration = JSON.parse(jsonContent) as Configuration;

const testCmd = 'cucumber-js src/smokeTest/features/* -r source-map-support/register -r out/smokeTest/steps/**/*.js --format json:tmp/reports/cucumber-report.json --format summary --environment=0';

async function runSmokeTest(index: number): Promise<void> {
    const args = ['cucumber-js', 'src/smokeTest/features/*', '-r', 'source-map-support/register', '-r', 'out/smokeTest/steps/**/*.js', '--format', 'json:tmp/reports/cucumber-report.json', '--format', 'summary', '--environment=0'];
    const options: cp.SpawnOptions = { cwd: smokeTestExtensionDir };
    const proc = cp.spawn('npx', args, options);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    return new Promise(resolve => proc.on('exit', resolve));
}

async function runSmokeTests() {
    for (const env of configuration.environments) {
        const index = configuration.environments.indexOf(env);
        await runSmokeTest(index);
    }
}

runSmokeTests().then(noop).catch(ex => console.error(ex));
