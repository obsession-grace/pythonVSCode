// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, unmanaged } from 'inversify';
import { compare } from 'semver';
import '../../../common/extensions';
import { IFileSystem } from '../../../common/platform/types';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../../common/types';
import { PythonInterpreter } from '../../contracts';
import { IInterpreterAutoSeletionRule, IInterpreterAutoSeletionService } from '../types';

@injectable()
export abstract class BaseRuleService implements IInterpreterAutoSeletionRule {
    protected nextRule?: IInterpreterAutoSeletionRule;
    private readonly stateStore: IPersistentState<PythonInterpreter | undefined>;
    constructor(@unmanaged() private readonly ruleName: string,
        @inject(IFileSystem) private readonly fs: IFileSystem,
        @inject(IPersistentStateFactory) stateFactory: IPersistentStateFactory) {
        this.stateStore = stateFactory.createGlobalPersistentState<PythonInterpreter | undefined>(`IInterpreterAutoSeletionRule-${this.ruleName}`, undefined);
    }
    public setNextRule(rule: IInterpreterAutoSeletionRule): void {
        this.nextRule = rule;
    }
    public async autoSelectInterpreter(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
        await this.clearCachedInterpreterIfInvalid(resource);
    }
    public getPreviouslyAutoSelectedInterpreter(_resource: Resource): PythonInterpreter | undefined {
        return this.stateStore.value;
    }
    protected async setGlobalInterpreter(interpreter?: PythonInterpreter, manager?: IInterpreterAutoSeletionService): Promise<boolean> {
        if (interpreter) {
            await this.cacheSelectedInterpreter(undefined, interpreter);
        }
        if (!interpreter || !manager || !interpreter.version) {
            return false;
        }
        const preferredInterpreter = manager.getAutoSelectedInterpreter(undefined);
        if (preferredInterpreter && preferredInterpreter.version &&
            compare(interpreter.version.raw, preferredInterpreter.version.raw) > 0) {
            await manager.setGlobalInterpreter(interpreter);
            return true;
        }

        return false;
    }
    protected async clearCachedInterpreterIfInvalid(resource: Resource) {
        if (!this.stateStore.value || await this.fs.fileExists(this.stateStore.value.path)) {
            return;
        }
        await this.cacheSelectedInterpreter(resource, undefined);
    }
    protected async cacheSelectedInterpreter(_resource: Resource, interpreter: PythonInterpreter | undefined) {
        await this.stateStore.updateValue(interpreter);
    }
    protected async next(resource: Resource, manager?: IInterpreterAutoSeletionService): Promise<void> {
        return this.nextRule && manager ? this.nextRule.autoSelectInterpreter(resource, manager) : undefined;
    }
}
