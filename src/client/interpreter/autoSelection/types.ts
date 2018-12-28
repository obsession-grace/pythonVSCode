// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Event } from 'vscode';
import { Resource } from '../../common/types';

export const IBestAvailableInterpreterSelectorStratergy = Symbol('IBestAvailableInterpreterSelectorStratergy');
export interface IBestAvailableInterpreterSelectorStratergy<T> {
    priority: number;
    getInterpreter(resource: Resource): Promise<T>;
    getStoredInterpreter(resource: Resource): T;
    storeInterpreter(resource: Resource, interpreter: T): Promise<void>;
}
export const IInterpreterAutoSeletionProxyService = Symbol('IInterpreterAutoSeletionProxyService');
/**
 * Interface similar to IInterpreterAutoSeletionService, to avoid chickn n egg situation.
 * Do we get python path from config first or get auto selected interpreter first!?
 * However, the class that reads python Path, must first give preference to selected interpreter.
 * But all classes everywhere make use of python settings!
 * Solution - Use a proxy that does nothing first, but later the real instance is injected.
 *
 * @export
 * @interface IInterpreterAutoSeletionProxyService
 */
export interface IInterpreterAutoSeletionProxyService {
    readonly onDidChangeAutoSelectedInterpreter: Event<void>;
    getAutoSelectedInterpreter(resource: Resource): string | undefined;
    registerInstance?(instance: IInterpreterAutoSeletionProxyService): void;
}

export const IInterpreterAutoSeletionService = Symbol('IInterpreterAutoSeletionService');
export interface IInterpreterAutoSeletionService extends IInterpreterAutoSeletionProxyService {
    readonly onDidChangeAutoSelectedInterpreter: Event<void>;
    autoSelectInterpreter(resource: Resource): Promise<void>;
}

export enum AutoSelectionStratergy {
    currentPath = 'currentPath',
    workspace = 'workspace',
    system = 'system',
    windowsRegistry = 'windowsRegistry'
}
