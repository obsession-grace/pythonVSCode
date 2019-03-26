// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const reporter = require('cucumber-html-reporter');
const path = require('path');
const os = require('os');
const reportsDir = process.argv.length > 2 ? process.argv[2] : path.join(process.cwd(), '.vscode-test', 'reports')

const options = {
    theme: 'bootstrap',
    jsonFile: path.join(reportsDir, 'report.json'),
    output: path.join(reportsDir, 'report.html'),
    reportSuiteAsScenarios: true,
    launchReport: true,
    metadata: {
        "Platform": os.platform()
    }
};

reporter.generate(options, () => process.exit(0));
