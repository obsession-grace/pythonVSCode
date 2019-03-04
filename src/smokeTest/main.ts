// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as cp from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as stripComments from 'strip-json-comments';
import { smokeTestExtensionDir } from './constants';
import { noop } from './helpers';
import { Configuration } from './setup/config';

// tslint:disable:no-any

//cucumber-js src/smokeTest/features/* -r source-map-support/register -r out/smokeTest/steps/**/*.js --format json:tmp/reports/cucumber-report.json --format summary --environment=0
const configContent = fs.readFileSync(path.join(smokeTestExtensionDir, 'src', 'smokeTest', 'testConfig.json')).toString();
const jsonContent = stripComments(configContent);
const configuration = JSON.parse(jsonContent) as Configuration;

const testCmd = 'cucumber-js src/smokeTest/features/* -r source-map-support/register -r out/smokeTest/steps/**/*.js --format json:tmp/reports/cucumber-report.json --format summary --environment=0';

async function runSmokeTest(index: number): Promise<void> {
    const env = configuration.environments[index];
    const tagQuery = env.tags || '';
    const tags = tagQuery.trim().length === 0 ? [] : ['--tags', tagQuery.trim()];
    const reportFile = `tmp/reports/cucumber-report${index}.json`;
    const reportFilePath = path.join(smokeTestExtensionDir, reportFile);
    await fs.ensureDir(path.dirname(reportFilePath));

    const args = ['cucumber-js', 'src/smokeTest/features/*',
        '-r', 'source-map-support/register', '-r', 'out/smokeTest/steps/**/*.js',
        ...tags,
        '--format', `json:${reportFile}`,
        '--format', 'summary',
        `--environment=${index}`];
    const options: cp.SpawnOptions = { cwd: smokeTestExtensionDir };
    const proc = cp.spawn('npx', args, options);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    await new Promise(resolve => proc.on('exit', resolve));
    const reportContent = await fs.readFile(reportFilePath, { encoding: 'utf-8' });
    const reportJson = JSON.parse(reportContent) as any[];
    const metadata = [
        { name: 'Test', value: env.name },
        { name: 'Environment', value: env.type },
        { name: 'Python', value: env.pythonVersion }
    ];
    reportJson.forEach(item => item.metadata = metadata);
    await fs.writeFile(reportFilePath, JSON.stringify(reportJson, undefined, 4));
}

async function runSmokeTests() {
    const promises: Promise<void>[] = [];
    for (const env of configuration.environments) {
        const index = configuration.environments.indexOf(env);
        await runSmokeTest(index);
        // promises.push(runSmokeTest(index));
    }
    // await Promise.all(promises);
}

runSmokeTests().then(noop).catch(ex => console.error(ex));
