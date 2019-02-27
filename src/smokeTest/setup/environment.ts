// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Application } from '../application';
import { createPipEnv, createVenv } from '../tests/interpreters/helper';
import { Enviroment, EnvironmentType, PipEnvEnviroment, VenvEnviroment, VirtualenvEnviroment } from './config';

// tslint:disable: no-any

const setupHandlers = new Map<EnvironmentType, Function>();
setupHandlers.set(EnvironmentType.conda, setupCondaEnvironment);
setupHandlers.set(EnvironmentType.pipenv, setupPipEnvEnvironment);
setupHandlers.set(EnvironmentType.venv, setupVenvEnvironment);
setupHandlers.set(EnvironmentType.virtualenv, setupVirtualEnvEnvironment);

export async function setupEnvironment(env: Enviroment, app: Application) {
    await setupHandlers.get(env.type)!(env as any, app);
}

async function setupCondaEnvironment(env: PipEnvEnviroment, app: Application) {
}
async function setupPipEnvEnvironment(env: PipEnvEnviroment, app: Application) {
    if (env.pythonPath) {
        env.pipEnvPythonPath = env.pythonPath;
        return;
    }
    await createPipEnv(env, app);
    env.pythonPath = env.pipEnvPythonPath;
}
async function setupVenvEnvironment(env: VenvEnviroment, app: Application) {
    if (env.pythonPath) {
        env.venvPythonPath = env.pythonPath;
        return;
    }
    await createVenv(env, app);
    env.pythonPath = env.venvPythonPath;
}
async function setupVirtualEnvEnvironment(env: VirtualenvEnviroment, app: Application) {

}
