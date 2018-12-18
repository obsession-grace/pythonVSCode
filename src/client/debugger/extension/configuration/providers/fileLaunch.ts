// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable } from 'inversify';
import { CancellationToken, DebugConfiguration, WorkspaceFolder } from 'vscode';
import { localize } from '../../../../common/utils/localize';
import { DebugConfigurationType, IDebugConfigurationProvider } from '../../types';

@injectable()
export class FileLaunchDebugConfigurationProvider implements IDebugConfigurationProvider {
    public isSupported(debugConfigurationType: DebugConfigurationType): boolean {
        return debugConfigurationType === DebugConfigurationType.launchFile;
    }
    public async provideDebugConfigurations(_folder: WorkspaceFolder, _token?: CancellationToken): Promise<DebugConfiguration[]> {
        return [
            {
                name: localize('python.snippet.launch.standard.label', 'Python: Current File')(),
                type: 'python',
                request: 'launch',
                // tslint:disable-next-line:no-invalid-template-strings
                program: '${file}'
            }
        ];
    }
}
