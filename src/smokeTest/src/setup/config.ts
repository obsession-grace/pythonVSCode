// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as stripComments from 'strip-json-comments';

// tslint:disable: no-any
export enum EnvironmentType {
    pipenv = 'pipenv',
    venv = 'venv',
    virtualenv = 'virtualenv',
    conda = 'conda'
};

export type Enviroment = {
    name: string;
    type: EnvironmentType;
    displayNameParts: string[];
    delayForActivation: number;
    pythonPath?: string;
    settings: { [key: string]: any };
};
export type PipEnvEnviroment = Enviroment & {
    pipEnvArgs?: string[];
    pipEnvPath?: string;
    // This is not in the configuration, it will be used in code to store the
    // path of the python interpreter created.
    pipEnvPythonPath: string;
};
export type VenvEnviroment = Enviroment & {
    venvBasePythonPath: string;
    venvArgs?: string[];
    // This is not in the configuration, it will be used in code to store the
    // path of the python interpreter created.
    venvPythonPath: string;
};
export type VirtualenvEnviroment = Enviroment & {
};

export type Configuration = {
    testRepositoryUri: string;
    tempFolder: string;
    screenShotsFolder: string;
    vscodePath: string;
    environments: Enviroment[];
    genericPyhtonPath: string;
    workspaceFolder: string;
    userSettingsJsonPath: string;
};

let configuration: Configuration;
/**
 * Gets the configuration file used to configure the smoke tests.
 *
 * @export
 * @returns
 */
export function getConfiguration(configFile: string = path.join(process.cwd(), 'testConfig.json')) {
    if (configuration) {
        return configuration;
    }
    const jsonContent = fs.readFileSync(configFile, 'utf8');
    const json = stripComments(jsonContent);
    return configuration = JSON.parse(json) as Configuration;
}
