// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import * as stripComments from 'strip-json-comments';
import { StatusBarAlignment, StatusBarItem } from 'vscode';
import { IApplicationShell, ICommandManager, ITerminalManager } from '../common/application/types';
import { IDisposable, IDisposableRegistry } from '../common/types';
import { sleep } from '../common/utils/async';
import { EXTENSION_ROOT_DIR } from '../constants';

const devToolsCommand = 'python.showDevTools';

@injectable()
export class SmokeTestLauncher implements IDisposable {
    private disposables: IDisposable[] = [];
    private statusBar?: StatusBarItem;
    constructor(@inject(IApplicationShell) private readonly appShell: IApplicationShell,
        @inject(ICommandManager) private readonly cmdManager: ICommandManager,
        @inject(IDisposableRegistry) private readonly disposableRegistry: IDisposableRegistry,
        @inject(ITerminalManager) private readonly terminalManager: ITerminalManager) {
        disposableRegistry.push(this);
    }
    public dispose() {
        this.disposables.forEach(d => d.dispose());
    }
    public register() {
        this.statusBar = this.appShell.createStatusBarItem(StatusBarAlignment.Right, 100000);
        this.disposables.push(this.statusBar);
        this.statusBar.command = devToolsCommand;
        this.statusBar.text = '$(tools) PyTools';
        this.statusBar.show();
        this.disposables.push(this.cmdManager.registerCommand(devToolsCommand, this.showDevToolsMenu, this));
    }
    private async showDevToolsMenu() {
        const smokeTests = 'Run Smoke Tests';

        const item = await this.appShell.showQuickPick([smokeTests], { ignoreFocusOut: true });
        if (item === smokeTests) {
            await this.launchSmokeTests();
        }
    }
    private async launchSmokeTests() {
        const smokeTestDir = path.join(EXTENSION_ROOT_DIR, 'src', 'smokeTest');
        const configFile = path.join(smokeTestDir, 'testConfig.json');
        const jsonContent = fs.readFileSync(configFile, 'utf8');
        const json = stripComments(jsonContent);
        const configuration = JSON.parse(json) as { environments: { name: string }[] };

        let index = 0;
        for (const env of configuration.environments) {
            const terminal = this.terminalManager.createTerminal({ cwd: smokeTestDir, name: env.name });
            this.disposables.push(terminal);
            await sleep(3000);
            terminal.sendText(`node test/index.js --config=testConfig.json --environment=${index}`);
            terminal.show(false);
            await sleep(10_000);
            index += 1;
        }
    }
}
