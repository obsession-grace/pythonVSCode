// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { Event, EventEmitter } from 'vscode';
import { IWorkspaceService } from '../../common/application/types';
import '../../common/extensions';
import { IFileSystem } from '../../common/platform/types';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../common/types';
import { IInterpreterHelper, PythonInterpreter } from '../contracts';
import { InterpreterAutoSeletionProxyService } from './proxy';
import { CurrentPathInterpreterSelectionStratergy } from './stratergies/currentPath';
import { SystemInterpreterSelectionStratergy } from './stratergies/system';
import { WindowsRegistryInterpreterSelectionStratergy } from './stratergies/windowsRegistry';
import { WorkspaceInterpreterSelectionStratergy } from './stratergies/workspace';
import { IBestAvailableInterpreterSelectorStratergy, IInterpreterAutoSeletionProxyService, IInterpreterAutoSeletionService } from './types';

const preferredGlobalInterpreter = 'preferredGlobalInterpreter';

@injectable()
export class InterpreterAutoSeletionService implements IInterpreterAutoSeletionService {
    private readonly didAutoSelectedInterpreterEmitter = new EventEmitter<void>();
    private readonly stratergies: IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | string | undefined>[];
    private readonly preferredInterpreter: IPersistentState<PythonInterpreter | undefined>;
    private readonly autoSelectedInterpreter = new Map<string, string | undefined>();
    constructor(@inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IFileSystem) private readonly fs: IFileSystem,
        @inject(IPersistentStateFactory) private readonly stateFactory: IPersistentStateFactory,
        @inject(IInterpreterAutoSeletionProxyService) private readonly proxy: InterpreterAutoSeletionProxyService,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named('system') private readonly systemInterpreter: SystemInterpreterSelectionStratergy,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named('currentPath') private readonly currentPathInterpreter: CurrentPathInterpreterSelectionStratergy,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named('winReg') private readonly winRegInterpreter: WindowsRegistryInterpreterSelectionStratergy,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named('workspace') private readonly workspaceInterpreter: WorkspaceInterpreterSelectionStratergy) {
        this.preferredInterpreter = this.stateFactory.createGlobalPersistentState<PythonInterpreter>(preferredGlobalInterpreter, undefined);
        // Do not change the order of the stratergies.
        // First check workspace, then system interpreters, then current path.
        this.stratergies = [this.workspaceInterpreter, this.systemInterpreter, this.winRegInterpreter, this.currentPathInterpreter].sort((a, b) => a.priority > b.priority ? 1 : 0);
        this.proxy.registerInstance(this);
    }
    public registerInstance(instance: IInterpreterAutoSeletionProxyService): void {
        throw new Error('Not implemented in InterpreterAutoSeletionService');
    }
    public get onDidChangeAutoSelectedInterpreter(): Event<void> {
        return this.didAutoSelectedInterpreterEmitter.event;
    }
    public getAutoSelectedInterpreter(resource: Resource): string | undefined {
        // Do not execute anycode other than fetching fromm a property.
        // This method gets invoked from settings class, and this class in turn uses classes that relies on settings.
        // I.e. we can end up in a recursive loop.
        const workspaceFolderPath = this.getWorkspacePath(resource);
        return this.autoSelectedInterpreter.get(workspaceFolderPath);
    }
    public async autoSelectInterpreter(resource: Resource): Promise<void> {
        this.storeAutoSelectedInterperter(resource, undefined);

        const activeWorkspace = this.helper.getActiveWorkspaceUri(resource);
        // Always update the best available system interpreters in the background.
        // This will be used in step 3.
        this.autoSelectBestAvailableSystemInterpreter(resource).ignoreErrors();

        // 1. First check workspace, if we have an interpreter for the workspace such as pipenv, virtualenv
        // then update the settings and exit.
        const workspaceInterpreterSelected = activeWorkspace ? await this.autoSelectWorkspaceInterpreter(resource) : false;
        if (workspaceInterpreterSelected) {
            return;
        }

        // Possible the user uninstall a version python, we need to ensure we don't use one that no longer exists.
        await this.clearInvalidAutoSelectedInterpreters(resource);

        // 2. If we have it cached, then use it.
        if (this.preferredInterpreter.value) {
            return;
        }

        // 3. Get stored interpreters from previously stored interpreters from system and current path.
        if (await this.getBestAvailableInterpreterFromStoredValues(resource)) {
            return;
        }

        // 4. Get interpreters from current path.
        // 5. Get interpreters from windows registry.
        // 6. Get interpreters from system path.
        // This is the worst case scenario and slowest of all, as we'll be enumerating
        // all interpreters on the entire system, and that's slow (e.g. conda, etc).
        for (const stratergy of [this.currentPathInterpreter, this.winRegInterpreter, this.systemInterpreter]) {
            if (await this.autoSelectInterpreterFromStratergy(resource, stratergy)) {
                return;
            }
        }
    }
    protected async autoSelectInterpreterFromStratergy(resource: Resource, stratergy: IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | undefined>): Promise<boolean> {
        let interpreter = stratergy.getStoredInterpreter(resource);
        if (interpreter) {
            await this.preferredInterpreter.updateValue(interpreter);
            this.storeAutoSelectedInterperter(resource, interpreter);
            return true;
        }
        interpreter = await this.currentPathInterpreter.getInterpreter(resource);
        if (interpreter) {
            await this.currentPathInterpreter.storeInterpreter(resource, interpreter);
            await this.preferredInterpreter.updateValue(interpreter);
            this.storeAutoSelectedInterperter(resource, interpreter);
            return true;
        }
        return false;
    }
    protected async autoSelectBestAvailableSystemInterpreter(resource): Promise<void> {
        const interpreter = await this.systemInterpreter.getInterpreter(resource);
        if (interpreter) {
            await this.systemInterpreter.storeInterpreter(resource, interpreter);
            await this.preferredInterpreter.updateValue(interpreter);
            return;
        }
    }
    protected async autoSelectWorkspaceInterpreter(resource: Resource): Promise<boolean> {
        const activeWorkspace = this.helper.getActiveWorkspaceUri(resource);

        // 1. First check workspace, if we have an interpreter for the workspace such as pipenv, virtualenv
        // then update the settings and exit.
        if (!activeWorkspace) {
            return false;
        }
        // If we already have an interpreter stored for the workspace, then exit.
        const interpreter = this.workspaceInterpreter.getStoredInterpreter(resource);
        if (interpreter) {
            this.storeAutoSelectedInterperter(resource, interpreter);
            return true;
        }
        const workspaceInterpreter = await this.workspaceInterpreter.getInterpreter(resource);
        if (workspaceInterpreter) {
            await this.workspaceInterpreter.storeInterpreter(resource, workspaceInterpreter);
            this.storeAutoSelectedInterperter(resource, workspaceInterpreter);
            return true;
        }

        return false;
    }
    protected async getBestAvailableInterpreterFromStoredValues(resource: Resource): Promise<boolean> {
        const storedInterpreters = [
            this.systemInterpreter.getStoredInterpreter(resource),
            this.currentPathInterpreter.getStoredInterpreter(resource),
            this.winRegInterpreter.getStoredInterpreter(resource)
        ];

        // Find out which interpreter is the best.
        const interpreters = storedInterpreters.filter(item => !!item).map(item => item!);
        const bestInterpreter = this.helper.getBestInterpreter(interpreters);
        if (!bestInterpreter) {
            return false;
        }
        if (this.preferredInterpreter.value && this.preferredInterpreter.value.path !== bestInterpreter.path) {
            await this.preferredInterpreter.updateValue(bestInterpreter);
            this.storeAutoSelectedInterperter(resource, bestInterpreter);
            return true;
        }
        return false;
    }
    /**
     * Check what interpreters were auto selected by each stratergy, if invalid, then clear it.
     * Workspace Interpreterpreters will not be validated, its upto the user to deal with it, as those
     * details are stored in settings.json file.
     * @private
     * @param {Resource} resource
     * @returns {Promise<void>}
     * @memberof InterpreterAutoSeletionService
     */
    private async clearInvalidAutoSelectedInterpreters(resource: Resource): Promise<void> {
        const promise = Promise.all(this.stratergies.map(async stratergy => {
            const interpreter = stratergy.getStoredInterpreter(resource);
            if (interpreter && typeof interpreter === 'object' && !await this.fs.fileExists(interpreter.path)) {
                await stratergy.storeInterpreter(resource, undefined);
            }
        }));

        const promise2 = async () => {
            if (this.preferredInterpreter.value && !await this.fs.fileExists(this.preferredInterpreter.value.path)) {
                await this.preferredInterpreter.updateValue(undefined);
            }
        };
        await Promise.all([promise, promise2()]);
    }
    private storeAutoSelectedInterperter(resource: Resource, interpreter: PythonInterpreter | string | undefined) {
        const workspaceFolderPath = this.getWorkspacePath(resource);
        const interpreterPath = interpreter ? (typeof interpreter === 'string' ? interpreter : interpreter.path) : undefined;
        this.autoSelectedInterpreter.set(workspaceFolderPath, interpreterPath);
    }
    private getWorkspacePath(resource: Resource): string {
        const workspaceFolder = resource ? this.workspaceService.getWorkspaceFolder(resource) : undefined;
        return workspaceFolder ? workspaceFolder.uri.fsPath : '';
    }
}
