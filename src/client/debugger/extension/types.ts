// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { CancellationToken, DebugConfiguration, DebugConfigurationProvider, ProviderResult, WorkspaceFolder } from 'vscode';

export const IDebugConfigurationService = Symbol('IDebugConfigurationService');
export interface IDebugConfigurationService extends DebugConfigurationProvider { }
export const IDebuggerBanner = Symbol('IDebuggerBanner');
export interface IDebuggerBanner {
    initialize(): void;
}

export const IDebugConfigurationProvider = Symbol('IDebugConfigurationProvider');
export interface IDebugConfigurationProvider {
    isSupported(debugConfigurationType: DebugConfigurationType): boolean;
    /**
     * Provides initial [debug configuration](#DebugConfiguration). If more than one debug configuration provider is
     * registered for the same type, debug configurations are concatenated in arbitrary order.
     *
     * @param folder The workspace folder for which the configurations are used or undefined for a folderless setup.
     * @param token A cancellation token.
     * @return An array of [debug configurations](#DebugConfiguration).
     */
    provideDebugConfigurations(folder: WorkspaceFolder | undefined, token?: CancellationToken): ProviderResult<DebugConfiguration[]>;
}
export const IDebugConfigurationPicker = Symbol('IDebugConfigurationPicker');
export interface IDebugConfigurationPicker {
    getSelectedConfiguration(folder: WorkspaceFolder | undefined, token?: CancellationToken): Promise<DebugConfigurationType | undefined>;
}

export enum DebugConfigurationType {
    launchFile = 'launchFile',
    remoteAttach = 'remoteAttach',
    launchDjango = 'launchDjango',
    launchFlask = 'launchFlask',
    launchModule = 'launchModule'
}
