// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { Uri } from 'vscode';
import { IWorkspaceService } from '../../../common/application/types';
import { IPlatformService } from '../../../common/platform/types';
import { IConfigurationService, Resource } from '../../../common/types';
import { createDeferredFrom } from '../../../common/utils/async';
import { IPythonPathUpdaterServiceManager } from '../../configuration/types';
import { IInterpreterHelper, IInterpreterLocatorService, PIPENV_SERVICE, PythonInterpreter, WORKSPACE_VIRTUAL_ENV_SERVICE } from '../../contracts';
import { IBestAvailableInterpreterSelectorStratergy } from '../types';

/**
 * Gets a best available interpreter specific to the current workspace.
 * @export
 * @class WorkspaceInterpreterSelectionStratergy
 * @implements {IBestInterpreterSelectorStratergy}
 */
@injectable()
export class WorkspaceInterpreterSelectionStratergy implements IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | string | undefined> {
    public readonly priority = 1;
    constructor(@inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
        @inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IPlatformService) private readonly platform: IPlatformService,
        @inject(IConfigurationService) private readonly configurationService: IConfigurationService,
        @inject(IPythonPathUpdaterServiceManager) private readonly pythonPathUpdaterService: IPythonPathUpdaterServiceManager,
        @inject(IInterpreterLocatorService) @named(PIPENV_SERVICE) private readonly pipEnvInterpreterLocator: IInterpreterLocatorService,
        @inject(IInterpreterLocatorService) @named(WORKSPACE_VIRTUAL_ENV_SERVICE) private readonly workspaceVirtualEnvInterpreterLocator: IInterpreterLocatorService) {

    }
    public async getInterpreter(resource: Resource): Promise<PythonInterpreter | string | undefined> {
        const activeWorkspace = this.helper.getActiveWorkspaceUri(resource);
        if (!activeWorkspace) {
            return;
        }
        const pipEnvPromise = createDeferredFrom(this.getWorkspacePipEnvInterpreters(resource));
        const virtualEnvPromise = createDeferredFrom(this.getWorkspaceVirtualEnvInterpreters(resource));

        const interpreters = await Promise.race([pipEnvPromise.promise, virtualEnvPromise.promise]);
        let bestInterperter: PythonInterpreter | undefined;
        if (Array.isArray(interpreters) && interpreters.length > 0) {
            bestInterperter = this.helper.getBestInterpreter(interpreters);
        } else {
            const [pipEnv, virtualEnv] = await Promise.all([pipEnvPromise.promise, virtualEnvPromise.promise]);
            const pipEnvList = Array.isArray(pipEnv) ? pipEnv : [];
            const virtualEnvList = Array.isArray(virtualEnv) ? virtualEnv : [];
            bestInterperter = this.helper.getBestInterpreter(pipEnvList.concat(virtualEnvList));
        }
        return bestInterperter;
    }
    public getStoredInterpreter(resource: Resource): string | undefined {
        const pythonConfig = this.workspaceService.getConfiguration('python', resource)!;
        const pythonPathInConfig = pythonConfig.inspect<string>('pythonPath')!;
        if ((pythonPathInConfig.workspaceValue && pythonPathInConfig.workspaceValue !== 'python') ||
            (pythonPathInConfig.workspaceFolderValue && pythonPathInConfig.workspaceFolderValue !== 'python')) {
            return this.configurationService.getSettings(resource).pythonPath;
        }
    }
    public async storeInterpreter(resource: Resource, interpreter: PythonInterpreter | string): Promise<void> {
        // We should never clear settings in user settings.json.
        if (!interpreter) {
            return;
        }
        const activeWorkspace = this.helper.getActiveWorkspaceUri(resource);
        if (!activeWorkspace) {
            return;
        }
        const interpreterPath = typeof interpreter === 'string' ? interpreter : interpreter.path;
        await this.pythonPathUpdaterService.updatePythonPath(interpreterPath, activeWorkspace.configTarget, 'load', activeWorkspace.folderUri);
    }

    protected async getWorkspacePipEnvInterpreters(resource: Resource): Promise<PythonInterpreter[] | undefined> {
        return this.pipEnvInterpreterLocator.getInterpreters(resource, true);
    }
    protected async getWorkspaceVirtualEnvInterpreters(resource: Resource): Promise<PythonInterpreter[] | undefined> {
        if (!resource) {
            return;
        }
        const workspaceFolder = this.workspaceService.getWorkspaceFolder(resource);
        if (!workspaceFolder) {
            return;
        }
        // Now check virtual environments under the workspace root
        const interpreters = await this.workspaceVirtualEnvInterpreterLocator.getInterpreters(resource, true);
        const workspacePath = this.platform.isWindows ? workspaceFolder.uri.fsPath.toUpperCase() : workspaceFolder.uri.fsPath;

        return interpreters.filter(interpreter => {
            const fsPath = Uri.file(interpreter.path).fsPath;
            const fsPathToCompare = this.platform.isWindows ? fsPath.toUpperCase() : fsPath;
            return fsPathToCompare.startsWith(workspacePath);
        });
    }
}
