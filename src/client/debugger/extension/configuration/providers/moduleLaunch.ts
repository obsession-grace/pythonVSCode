// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { CancellationToken, DebugConfiguration, InputBoxOptions, WorkspaceFolder } from 'vscode';
import { IApplicationShell } from '../../../../common/application/types';
import { localize } from '../../../../common/utils/localize';
import { DebugConfigurationType, IDebugConfigurationProvider } from '../../types';

@injectable()
export class ModuleLaunchDebugConfigurationProvider implements IDebugConfigurationProvider {
    constructor(@inject(IApplicationShell) private shell: IApplicationShell) { }
    public isSupported(debugConfigurationType: DebugConfigurationType): boolean {
        return debugConfigurationType === DebugConfigurationType.launchModule;
    }
    public async provideDebugConfigurations(_folder: WorkspaceFolder, token?: CancellationToken): Promise<DebugConfiguration[]> {
        const moduleName = await this.getModuleName(token);
        return [
            {
                name: localize('python.snippet.launch.standard.label', 'Python: Current File')(),
                type: 'python',
                request: 'launch',
                module: moduleName
            }
        ];
    }
    protected async getModuleName(token): Promise<string | undefined> {
        const options: InputBoxOptions = {
            ignoreFocusOut: false,
            placeHolder: 'my.module',
            prompt: 'Enter Python Module/Package name',
            value: ''
        };
        return this.shell.showInputBox(options, token);
    }

}
