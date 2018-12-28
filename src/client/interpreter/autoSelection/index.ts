// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { compare } from 'semver';
import { Event, EventEmitter } from 'vscode';
import { IWorkspaceService } from '../../common/application/types';
import '../../common/extensions';
import { IFileSystem } from '../../common/platform/types';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../common/types';
import { captureTelemetry, sendTelemetryEvent } from '../../telemetry';
import { PYTHON_INTERPRETER_AUTO_SELECTION } from '../../telemetry/constants';
import { IInterpreterHelper, PythonInterpreter } from '../contracts';
import { InterpreterAutoSeletionProxyService } from './proxy';
import { CurrentPathInterpreterSelectionStratergy } from './stratergies/currentPath';
import { SystemInterpreterSelectionStratergy } from './stratergies/system';
import { WindowsRegistryInterpreterSelectionStratergy } from './stratergies/windowsRegistry';
import { WorkspaceInterpreterSelectionStratergy } from './stratergies/workspace';
import { AutoSelectionStratergy, IBestAvailableInterpreterSelectorStratergy, IInterpreterAutoSeletionProxyService, IInterpreterAutoSeletionService } from './types';

const preferredGlobalInterpreter = 'preferredGlobalInterpreter';

@injectable()
export class InterpreterAutoSeletionService implements IInterpreterAutoSeletionService {
    private readonly didAutoSelectedInterpreterEmitter = new EventEmitter<void>();
    private readonly stratergies: IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | undefined>[];
    private readonly globallyPreferredInterpreter: IPersistentState<PythonInterpreter | undefined>;
    private readonly autoSelectedInterpreterByWorkspace = new Map<string, string | undefined>();
    constructor(@inject(IInterpreterHelper) private readonly helper: IInterpreterHelper,
        @inject(IFileSystem) private readonly fs: IFileSystem,
        @inject(IPersistentStateFactory) private readonly stateFactory: IPersistentStateFactory,
        @inject(IInterpreterAutoSeletionProxyService) private readonly proxy: InterpreterAutoSeletionProxyService,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named(AutoSelectionStratergy.system) private readonly systemInterpreter: SystemInterpreterSelectionStratergy,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named(AutoSelectionStratergy.currentPath) private readonly currentPathInterpreter: CurrentPathInterpreterSelectionStratergy,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named(AutoSelectionStratergy.windowsRegistry) private readonly winRegInterpreter: WindowsRegistryInterpreterSelectionStratergy,
        @inject(IBestAvailableInterpreterSelectorStratergy) @named(AutoSelectionStratergy.workspace) private readonly workspaceInterpreter: WorkspaceInterpreterSelectionStratergy) {
        this.globallyPreferredInterpreter = this.stateFactory.createGlobalPersistentState<PythonInterpreter>(preferredGlobalInterpreter, undefined);
        // Do not change the order of the stratergies.
        // First check workspace, then system interpreters, then current path.
        this.stratergies = [this.systemInterpreter, this.winRegInterpreter, this.currentPathInterpreter].sort((a, b) => a.priority > b.priority ? 1 : 0);
        this.proxy.registerInstance(this);
    }
    public get onDidChangeAutoSelectedInterpreter(): Event<void> {
        return this.didAutoSelectedInterpreterEmitter.event;
    }
    public getAutoSelectedInterpreter(resource: Resource): string | undefined {
        // Do not execute anycode other than fetching fromm a property.
        // This method gets invoked from settings class, and this class in turn uses classes that relies on settings.
        // I.e. we can end up in a recursive loop.
        const workspaceFolderPath = this.getWorkspacePathKey(resource);
        const value = this.autoSelectedInterpreterByWorkspace.get(workspaceFolderPath);
        if (value) {
            return value;
        }
        return this.globallyPreferredInterpreter.value ? this.globallyPreferredInterpreter.value.path : undefined;
    }
    @captureTelemetry(PYTHON_INTERPRETER_AUTO_SELECTION, { stratergy: 'main' }, true)
    public async autoSelectInterpreter(resource: Resource): Promise<void> {
        // Always update the best available interpreters (system wide) in the background.
        // This will be used in step 2 (either immediately or later when vsc loads again).
        this.autoSelectBestAvailableSystemInterpreterInBackground(resource);

        const activeWorkspace = this.helper.getActiveWorkspaceUri(resource);

        // 1. First check workspace, if we have an interpreter for the workspace such as pipenv, virtualenv
        // then update the settings and exit.
        const workspaceInterpreterSelected = activeWorkspace ? await this.autoSelectWorkspaceInterpreter(resource) : false;
        if (workspaceInterpreterSelected) {
            sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { stratergy: 'workspace', identified: true });
            return;
        }

        // Possible the user uninstalled a python interrpeter, we need to ensure we don't use one that no longer exists.
        await this.clearInvalidAutoSelectedInterpreters(resource);

        // 2. Get best availale interpreter by checking previously stored values from each stratergy.
        // Always do this over using cached item as this is fast and will udpate cache if necessary.
        if (await this.getBestAvailableInterpreterFromStoredValues(resource)) {
            sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { stratergy: 'main', identified: true });
            return;
        }

        // 3. If we have a interpreter cached, then use it.
        if (this.globallyPreferredInterpreter.value) {
            sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { stratergy: 'main', identified: true });
            return;
        }

        // 4. Get interpreters from current path.
        // 5. Get interpreters from windows registry.
        // 6. Get interpreters from system path.
        // This is the worst case scenario and slowest of all, as we'll be enumerating
        // all interpreters on multiple stratergies, including the entire system, and that's slow (e.g. conda, etc).
        for (const stratergy of this.stratergies) {
            if (await this.autoSelectInterpreterFromStratergy(resource, stratergy)) {
                return;
            }
        }
    }
    protected async autoSelectInterpreterFromStratergy(resource: Resource, stratergy: IBestAvailableInterpreterSelectorStratergy<PythonInterpreter | undefined>): Promise<boolean> {
        let interpreter = stratergy.getStoredInterpreter(resource);
        if (interpreter) {
            sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { updated: !!this.globallyPreferredInterpreter.value });
            await this.globallyPreferredInterpreter.updateValue(interpreter);
            this.storeAutoSelectedInterperter(resource, interpreter);
            return true;
        }
        interpreter = await stratergy.getInterpreter(resource);
        if (interpreter) {
            sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { updated: !!this.globallyPreferredInterpreter.value });
            await stratergy.storeInterpreter(resource, interpreter);
            await this.globallyPreferredInterpreter.updateValue(interpreter);
            this.storeAutoSelectedInterperter(resource, interpreter);
            return true;
        }
        return false;
    }
    protected autoSelectBestAvailableSystemInterpreterInBackground(resource: Resource) {
        this.systemInterpreter.getInterpreter(resource)
            .then(interpreter => this.systemInterpreter.storeInterpreter(resource, interpreter))
            .ignoreErrors();
    }
    protected async autoSelectWorkspaceInterpreter(resource: Resource): Promise<boolean> {
        // 1. First check workspace, if we have an interpreter for the workspace such as pipenv, virtualenv
        // then update the settings and exit.
        if (!this.helper.getActiveWorkspaceUri(resource)) {
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
        // If identified interpreter is not better than previously cached interpreter then don't update.
        // Then just exit, as the cached one is better.
        if (this.globallyPreferredInterpreter.value && this.globallyPreferredInterpreter.value.version &&
            bestInterpreter.version &&
            compare(this.globallyPreferredInterpreter.value.version.raw, bestInterpreter.version.raw) > 0) {
            return false;
        }

        if (!this.globallyPreferredInterpreter.value ||
            (this.globallyPreferredInterpreter.value && this.globallyPreferredInterpreter.value.path !== bestInterpreter.path)) {
            sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { updated: !!this.globallyPreferredInterpreter.value });
            await this.globallyPreferredInterpreter.updateValue(bestInterpreter);
        }
        this.storeAutoSelectedInterperter(resource, bestInterpreter);
        return true;
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
    protected async clearInvalidAutoSelectedInterpreters(resource: Resource): Promise<void> {
        const promise = Promise.all(this.stratergies.map(async stratergy => {
            const interpreter = stratergy.getStoredInterpreter(resource);
            if (interpreter) {
                if ((typeof interpreter === 'object' && !await this.fs.fileExists(interpreter.path)) ||
                    (typeof interpreter === 'string' && !await this.fs.fileExists(interpreter))) {
                    sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { interpreterMissing: true });
                    await stratergy.storeInterpreter(resource, undefined);
                }
            }
        }));

        const promise2 = async () => {
            if (this.globallyPreferredInterpreter.value && !await this.fs.fileExists(this.globallyPreferredInterpreter.value.path)) {
                sendTelemetryEvent(PYTHON_INTERPRETER_AUTO_SELECTION, undefined, { interpreterMissing: true });
                await this.globallyPreferredInterpreter.updateValue(undefined);
                this.didAutoSelectedInterpreterEmitter.fire();
            }
        };
        await Promise.all([promise, promise2()]);
    }
    protected storeAutoSelectedInterperter(resource: Resource, interpreter: PythonInterpreter | string | undefined) {
        const workspaceFolderPath = this.getWorkspacePathKey(resource);
        const interpreterPath = interpreter ? (typeof interpreter === 'string' ? interpreter : interpreter.path) : undefined;
        this.autoSelectedInterpreterByWorkspace.set(workspaceFolderPath, interpreterPath);
        this.didAutoSelectedInterpreterEmitter.fire();
    }
    private getWorkspacePathKey(resource: Resource): string {
        const workspaceFolder = resource ? this.workspaceService.getWorkspaceFolder(resource) : undefined;
        return workspaceFolder ? workspaceFolder.uri.fsPath : '';
    }
}
