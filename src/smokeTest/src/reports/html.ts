// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const reporter = require('cucumber-html-reporter');
const options = {
    // theme: 'bootstrap', hierarchy
    theme: 'hierarchy',
    jsonFile: '/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode/cucumber-report.json',
    output: 'cucumber-report.html',
    reportSuiteAsScenarios: true,
    launchReport: true,
    metadata: {
        "App Version": "1.0.0",
        "Test Environment": "STAGING",
    }
};

reporter.generate(options);
