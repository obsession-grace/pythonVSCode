// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { CancellationToken, DebugConfiguration, InputBoxOptions, WorkspaceFolder } from 'vscode';
import { IApplicationShell } from '../../../../common/application/types';
import { Debug, localize } from '../../../../common/utils/localize';
import { DebugConfigurationType, IDebugConfigurationProvider } from '../../types';

@injectable()
export class AttachDebugConfigurationProvider implements IDebugConfigurationProvider {
    constructor(@inject(IApplicationShell) private shell: IApplicationShell) { }
    public isSupported(debugConfigurationType: DebugConfigurationType): boolean {
        return debugConfigurationType === DebugConfigurationType.remoteAttach;
    }
    public async provideDebugConfigurations(_folder: WorkspaceFolder, token?: CancellationToken): Promise<DebugConfiguration[]> {
        const host = await this.getHost(token);
        const port = await this.getPort(token);
        return [
            {
                name: localize('python.snippet.launch.attach.label', 'Python: Attach')(),
                type: 'python',
                request: 'attach',
                port: port,
                host: host
            }
        ];
    }
    protected async getHost(token?: CancellationToken): Promise<string | undefined> {
        const validateHost = (selection?: string | undefined) => {
            return (selection && selection.trim().length > 0) ? undefined : Debug.attachRemoteHostValidationError();
        };
        const options: InputBoxOptions = {
            placeHolder: Debug.attachRemoteHostPlaceholder(),
            value: 'localhost',
            validateInput: validateHost,
            ignoreFocusOut: true,
            prompt: Debug.attachRemoteHostPrompt()
        };
        return this.shell.showInputBox(options, token);
    }
    protected async getPort(token?: CancellationToken): Promise<number | undefined> {
        const validatePort = (selection?: string | undefined) => {
            return (selection && /^\d+$/.test(selection.trim())) ? undefined : Debug.attachRemotePortValidationError();
        };
        const options: InputBoxOptions = {
            placeHolder: Debug.attachRemotePortPlaceholder(),
            value: '5678',
            validateInput: validatePort,
            ignoreFocusOut: true,
            prompt: Debug.attachRemotePortPrompt()
        };
        const port = await this.shell.showInputBox(options, token);
        return port ? parseInt(port.trim(), 10) : undefined;
    }
}
