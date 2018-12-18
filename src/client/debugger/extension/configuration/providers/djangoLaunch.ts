// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import * as path from 'path';
import { CancellationToken, DebugConfiguration, OpenDialogOptions, WorkspaceFolder } from 'vscode';
import { IApplicationShell } from '../../../../common/application/types';
import { IFileSystem } from '../../../../common/platform/types';
import { IPathUtils } from '../../../../common/types';
import { Debug, localize } from '../../../../common/utils/localize';
import { DebugConfigurationType, IDebugConfigurationProvider } from '../../types';

// tslint:disable-next-line:no-invalid-template-strings
const workspaceFolderToken = '${workspaceFolder}';

@injectable()
export class DjangoLaunchDebugConfigurationProvider implements IDebugConfigurationProvider {
    constructor(@inject(IApplicationShell) private shell: IApplicationShell,
        @inject(IFileSystem) private fs: IFileSystem,
        @inject(IPathUtils) private pathUtils: IPathUtils) { }
    public isSupported(debugConfigurationType: DebugConfigurationType): boolean {
        return debugConfigurationType === DebugConfigurationType.launchDjango;
    }
    public async provideDebugConfigurations(folder: WorkspaceFolder, token?: CancellationToken): Promise<DebugConfiguration[]> {
        const program = await this.getManagePyPath(folder);
        return [
            {
                name: localize('python.snippet.launch.django.label', 'Python: Django')(),
                type: 'python',
                request: 'launch',
                program: program,
                args: [
                    'runserver',
                    '--noreload',
                    '--nothreading'
                ],
                django: true
            }
        ];
    }
    protected async getManagePyPath(folder: WorkspaceFolder): Promise<string | undefined> {
        const defaultLocationOfManagePy = path.join(folder.uri.fsPath, 'manage.py');
        if (await this.fs.fileExists(defaultLocationOfManagePy)) {
            return `${workspaceFolderToken}${this.pathUtils.separator}manage.py`;
        }

        const options: OpenDialogOptions = {
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            defaultUri: folder.uri,
            filters: { Python: ['py'] },
            openLabel: Debug.debugDjangoSelectManagePyOpenDialogLabel()
        };
        const files = await this.shell.showOpenDialog(options);
        if (!Array.isArray(files) || files.length !== 1) {
            return `${workspaceFolderToken}${this.pathUtils.separator}manage.py`;
        }

        const managePy = files[0].fsPath;
        const relativePath = path.relative(folder.uri.fsPath, folder.uri.fsPath);
        if (relativePath.startsWith('..') || relativePath.startsWith(this.pathUtils.separator)) {
            return managePy;
        }
        return `${workspaceFolderToken}${this.pathUtils.separator}${relativePath}`;
    }
}
