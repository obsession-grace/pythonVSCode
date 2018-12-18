// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import * as path from 'path';
import { CancellationToken, DebugConfiguration, OpenDialogOptions, WorkspaceFolder } from 'vscode';
import { IApplicationShell } from '../../../../common/application/types';
import { IFileSystem } from '../../../../common/platform/types';
import { Debug, localize } from '../../../../common/utils/localize';
import { DebugConfigurationType, IDebugConfigurationProvider } from '../../types';

@injectable()
export class FlaskLaunchDebugConfigurationProvider implements IDebugConfigurationProvider {
    constructor(@inject(IApplicationShell) private shell: IApplicationShell,
        @inject(IFileSystem) private fs: IFileSystem) { }
        public isSupported(debugConfigurationType: DebugConfigurationType): boolean {
            return debugConfigurationType === DebugConfigurationType.launchFlask;
        }
        public async provideDebugConfigurations(folder: WorkspaceFolder, token?: CancellationToken): Promise<DebugConfiguration[]> {
        const application = await this.getApplicationPath(folder);
        return [
            {
                name: localize('python.snippet.launch.flask.label', 'Python: Flask')(),
                type: 'python',
                request: 'launch',
                module: 'flask',
                env: {
                    FLASK_APP: application
                },
                args: [
                    'run',
                    '--no-debugger',
                    '--no-reload'
                ],
                jinja: true
            }
        ];
    }
    protected async getApplicationPath(folder: WorkspaceFolder): Promise<string | undefined> {
        const defaultLocationOfManagePy = path.join(folder.uri.fsPath, 'app.py');
        if (await this.fs.fileExists(defaultLocationOfManagePy)) {
            return 'app.py';
        }

        const options: OpenDialogOptions = {
            canSelectFiles: true,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: folder.uri,
            filters: { Python: ['py'] },
            openLabel: Debug.debugFlaskSelectAppOpenDialogLabel()
        };
        const selections = await this.shell.showOpenDialog(options);
        if (!Array.isArray(selections) || selections.length !== 1) {
            return 'app.py';
        }

        return path.basename(selections[0].fsPath);
    }
}
