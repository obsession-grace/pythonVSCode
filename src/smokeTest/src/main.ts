/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as fs from 'fs-extra';
import * as minimist from 'minimist';
import * as mkdirp from 'mkdirp';
import { ncp } from 'ncp';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as tmp from 'tmp';
import { Application, ApplicationOptions, Quality } from './application';
import { updateSetting } from './helpers/settings';
import { ConsoleLogger, FileLogger, Logger, MultiLogger } from './logger';
import { getConfiguration } from './setup/config';
import { setupEnvironment } from './setup/environment';
import { waitForExtensionToActivate } from './tests/activation/helper';
import { setupActivationTestsNoReload, setupActivationTestsWithReload } from './tests/activation/index';
import { setupIntellisenseTestsNoReload } from './tests/intellisense/index';
import { deletePipEnv, deleteVenvs, getPythonInterpreterPath, reloadToRefreshInterpreterDisplayNames as reloadToRefreshDisplayNames } from './tests/interpreters/helper';
import { setupInterpreterTestsNoReload, setupInterpreterTestsReload } from './tests/interpreters/index';
import { setupTerminalTestsNoReload } from './tests/terminal/index';

// tslint:disable: no-invalid-this mocha-no-side-effect-code no-any

const tmpDir = tmp.dirSync({ prefix: 't' }) as { name: string; removeCallback: Function };
const testDataPath = tmpDir.name;
process.once('exit', () => rimraf.sync(testDataPath));

const [, , ...args] = process.argv;
const opts = minimist(args, {
    string: ['build', 'stable-build', 'wait-time', 'test-repo', 'screenshots', 'log', 'config', 'environment'],
    boolean: ['verbose'],
    default: {
        verbose: false,
        config: 'testConfig.json'
    }
});

const config = getConfiguration(path.resolve(opts.config));

// const workspacePath = path.join(testDataPath, 'vscode-smoketest-express');
// const workspacePath = config.workspaceFolder; //'/Users/donjayamanne/Desktop/Development/PythonStuff/Blah';
// const extensionsPath = path.join(testDataPath, 'extensions-dir1234');
const extensionsPath = '/Users/donjayamanne/.vscode-insiders/extensions';
mkdirp.sync(extensionsPath);
opts.screenshots = '/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode/src/smokeTest/screenShots';
const screenshotsPath = opts.screenshots ? path.resolve(opts.screenshots) : null;

if (screenshotsPath) {
    mkdirp.sync(screenshotsPath);
}

function fail(errorMessage): void {
    console.error(errorMessage);
    process.exit(1);
}

const repoPath = path.join(__dirname, '..', '..', '..');

function getDevElectronPath(): string {
    const buildPath = path.join(repoPath, '.build');
    const product = require(path.join(repoPath, 'product.json'));

    switch (process.platform) {
        case 'darwin':
            return path.join(buildPath, 'electron', `${product.nameLong}.app`, 'Contents', 'MacOS', 'Electron');
        case 'linux':
            return path.join(buildPath, 'electron', `${product.applicationName}`);
        case 'win32':
            return path.join(buildPath, 'electron', `${product.nameShort}.exe`);
        default:
            throw new Error('Unsupported platform.');
    }
}

function getBuildElectronPath(root: string): string {
    switch (process.platform) {
        case 'darwin':
            return path.join(root, 'Contents', 'MacOS', 'Electron');
        case 'linux': {
            const product = require(path.join(root, 'resources', 'app', 'product.json'));
            return path.join(root, product.applicationName);
        }
        case 'win32': {
            const product = require(path.join(root, 'resources', 'app', 'product.json'));
            return path.join(root, `${product.nameShort}.exe`);
        }
        default:
            throw new Error('Unsupported platform.');
    }
}

let testCodePath = opts.build;
testCodePath =
    '/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode/.vscode-test/stable/Visual Studio Code.app';
// testCodePath = '/Applications/Visual Studio Code - Insiders.app';
// let stableCodePath = opts['stable-build'];
let electronPath: string;
// let stablePath: string;

if (testCodePath) {
    electronPath = getBuildElectronPath(testCodePath);

    // if (stableCodePath) {
    // 	stablePath = getBuildElectronPath(stableCodePath);
    // }
} else {
    testCodePath = getDevElectronPath();
    electronPath = testCodePath;
    process.env.VSCODE_REPOSITORY = repoPath;
    process.env.VSCODE_DEV = '1';
    process.env.VSCODE_CLI = '1';
}

if (!fs.existsSync(electronPath || '')) {
    fail(`Can't find Code at ${electronPath}.`);
}

const userDataDir = path.join(testDataPath, 'd');
const quality = Quality.Stable;

// let quality: Quality;
// if (process.env.VSCODE_DEV === '1') {
//     quality = Quality.Dev;
// } else if (
//     electronPath.indexOf('Code - Insiders') >= 0 /* macOS/Windows */ ||
//     electronPath.indexOf('code-insiders') /* Linux */ >= 0
// ) {
//     quality = Quality.Insiders;
// } else {
//     quality = Quality.Stable;
// }

async function setupRepository(): Promise<void> {
    const env = getConfiguration().environments[opts.environment];
    if (!config.workspaceFolder) {
        const folderPrefix = `env ${opts.environment}-${env.type}`;
        config.workspaceFolder = path.join(config.tempFolder, folderPrefix);
    }
    if ((await fs.pathExists(config.workspaceFolder))) {
        console.log(`*** Using existing test project... ${config.workspaceFolder}`);
    } else {
        console.log(`*** Cloning test project repository... ${config.workspaceFolder}`);
        cp.spawnSync('git', ['clone', config.testRepositoryUri, config.workspaceFolder]);
    }
    // else {
    // console.log('*** Cleaning test project repository...');
    // cp.spawnSync('git', ['fetch'], { cwd: workspacePath });
    // cp.spawnSync('git', ['reset', '--hard', 'FETCH_HEAD'], { cwd: workspacePath });
    // cp.spawnSync('git', ['clean', '-xdf'], { cwd: workspacePath });
    // }

    // console.log('*** Running yarn...');
    // cp.execSync('yarn', { cwd: workspacePath, stdio: 'inherit' });
}

async function setup(): Promise<void> {
    console.log('*** Test data:', testDataPath);
    console.log('*** Preparing smoketest setup...');
    await setupRepository();
    console.log('*** Smoketest setup done!\n');
}

function createOptions(): ApplicationOptions {
    const loggers: Logger[] = [];

    if (opts.verbose) {
        loggers.push(new ConsoleLogger());
    }

    let log: string | undefined = undefined;

    if (opts.log) {
        loggers.push(new FileLogger(opts.log));
        log = 'trace';
    }
    return {
        quality,
        codePath: opts.build,
        workspacePath: config.workspaceFolder,
        userDataDir,
        extensionsPath,
        waitTime: parseInt(opts['wait-time'] || '0') || 20,
        logger: new MultiLogger(loggers),
        verbose: opts.verbose,
        log,
        screenshotsPath
    };
}

before(async function () {
    // allow two minutes for setup
    this.timeout(2 * 60 * 1000);
    await setup();
    this.defaultOptions = createOptions();
});

after(async () => {
    await new Promise(c => setTimeout(c, 500)); // wait for shutdown

    if (opts.log) {
        const logsDir = path.join(userDataDir, 'logs');
        const destLogsDir = path.join(path.dirname(opts.log), 'logs');
        await new Promise((c, e) => ncp(logsDir, destLogsDir, err => (err ? e(err) : c())));
    }

    await new Promise((c, e) => rimraf(testDataPath, { maxBusyTries: 10 }, err => (err ? e(err) : c())));
});

// describe('Data Migration', () => {
// 	setupDataMigrationTests(userDataDir, createApp);
// });

describe('Launching VSCode', () => {
    before(async function () {
        const app = new Application(this.defaultOptions);
        await app!.start();
        this.app = app;

        app.configuration.genericPyhtonPath = await getPythonInterpreterPath(app.configuration.genericPyhtonPath);
    });

    after(async function () {
        await this.app.stop();
    });

    if (screenshotsPath) {
        afterEach(async function () {
            if (this.currentTest.state !== 'failed') {
                return;
            }
            const app = this.app as Application;
            const name = this.currentTest.fullTitle().replace(/[^a-z0-9\-]/gi, '_');

            await app.captureScreenshot(name);
        });
    }

    if (opts.log) {
        beforeEach(async function () {
            const app = this.app as Application;
            const title = this.currentTest.fullTitle();

            app.logger.log('*** Test start:', title);
        });
    }

    const env = getConfiguration().environments[opts.environment];
    describe(`Environment - ${env.name}`, () => {
        before(async function () {
            const app = this.app as Application;
            await updateSetting('python.terminal.activateEnvironment', false, app.workspacePathOrFolder);
            for (const setting of Object.keys(env.settings)) {
                await updateSetting(setting as any, env.settings[setting], app.workspacePathOrFolder);
            }
            await deletePipEnv(app);
            await deleteVenvs(app);

            await setupEnvironment(env, app);
            app.activeEnvironment = env;
            await updateSetting('python.pythonPath', app.activeEnvironment.pythonPath!, app.workspacePathOrFolder);
            // Ensure we refresh the environment list.
            await app.reload();
            await waitForExtensionToActivate(app);
            await app.workbench.quickopen.runCommand('Python: Select Interpreter');
            await app.workbench.quickopen.runCommand('View: Close All Editors');
            await reloadToRefreshDisplayNames(app);
        });

        // Setup tests that will not reload.
        setupActivationTestsNoReload();
        setupIntellisenseTestsNoReload();
        setupInterpreterTestsNoReload();
        setupTerminalTestsNoReload();

        // Setup tests that will cause VSC to reload.
        setupActivationTestsWithReload();
        setupInterpreterTestsReload();
    });
});

// setupLaunchTests();
