// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const reporter = require('cucumber-html-reporter');
const options = {
    // theme: 'bootstrap', hierarchy
    theme: 'hierarchy',
    // jsonFile: './tmp/reports/cucumber-report.json',
    jsonDir: './tmp/reports/',
    output: './tmp/reports/cucumber-report.html',
    reportSuiteAsScenarios: true,
    launchReport: true,
    metadata: {
        "App Version": "1.0.0",
        "Test Environment": "STAGING",
    }
};

reporter.generate(options);
