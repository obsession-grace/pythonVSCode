// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

import { DiagnosticCollection, Disposable, QuickPickOptions, Uri } from 'vscode';
import { IApplicationShell, ICommandManager, IDocumentManager } from '../common/application/types';
import { Commands } from '../common/constants';
import { IDisposable } from '../common/types';
import { IServiceContainer } from '../ioc/types';
import { ILinterManager, ILintingEngine } from './types';

export class LinterCommands implements IDisposable {
    private disposables: Disposable[] = [];
    private linterManager: ILinterManager;
    private readonly appShell: IApplicationShell;
    private readonly documentManager: IDocumentManager;

    constructor(private serviceContainer: IServiceContainer) {
        this.linterManager = this.serviceContainer.get<ILinterManager>(ILinterManager);
        this.appShell = this.serviceContainer.get<IApplicationShell>(IApplicationShell);
        this.documentManager = this.serviceContainer.get<IDocumentManager>(IDocumentManager);

        const commandManager = this.serviceContainer.get<ICommandManager>(ICommandManager);
        commandManager.registerCommand(Commands.Set_Linter, this.setLinterAsync.bind(this));
        commandManager.registerCommand(Commands.Enable_Linter, this.enableLintingAsync.bind(this));
        commandManager.registerCommand(Commands.Run_Linter, this.runLinting.bind(this));
    }
    public dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
    }

    public async setLinterAsync(): Promise<void> {
        const linters = this.linterManager.getAllLinterInfos();
        const suggestions = linters.map(x => x.id).sort();
        const activeLinters = await this.linterManager.getActiveLinters(true, this.settingsUri);

        let current: string;
        switch (activeLinters.length) {
            case 0:
                current = 'none';
                break;
            case 1:
                current = activeLinters[0].id;
                break;
            default:
                current = 'multiple selected';
                break;
        }

        const quickPickOptions: QuickPickOptions = {
            matchOnDetail: true,
            matchOnDescription: true,
            placeHolder: `current: ${current}`
        };

        const selection = await this.appShell.showQuickPick(suggestions, quickPickOptions);
        if (selection !== undefined) {
            const index = linters.findIndex(x => x.id === selection);
            if (activeLinters.length > 1) {
                // tslint:disable-next-line:messages-must-be-localized
                const response = await this.appShell.showWarningMessage(`Multiple linters are enabled in settings. Replace with '${selection}'?`, 'Yes', 'No');
                if (response !== 'Yes') {
                    return;
                }
            }
            await this.linterManager.setActiveLintersAsync([linters[index].product], this.settingsUri);
        }
    }

    public async enableLintingAsync(): Promise<void> {
        const options = ['on', 'off'];
        const current = await this.linterManager.isLintingEnabled(true, this.settingsUri) ? options[0] : options[1];

        const quickPickOptions: QuickPickOptions = {
            matchOnDetail: true,
            matchOnDescription: true,
            placeHolder: `current: ${current}`
        };

        const selection = await this.appShell.showQuickPick(options, quickPickOptions);
        if (selection !== undefined) {
            const enable = selection === options[0];
            await this.linterManager.enableLintingAsync(enable, this.settingsUri);
        }
    }

    public runLinting(): Promise<DiagnosticCollection> {
        const engine = this.serviceContainer.get<ILintingEngine>(ILintingEngine);
        return engine.lintOpenPythonFiles();
    }

    private get settingsUri(): Uri | undefined {
        return this.documentManager.activeTextEditor ? this.documentManager.activeTextEditor.document.uri : undefined;
    }
}
