// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable, unmanaged } from 'inversify';
import { DiagnosticSeverity } from 'vscode';
import { IWorkspaceService } from '../../common/application/types';
import { isUnitTestExecution } from '../../common/constants';
import { Resource } from '../../common/types';
import { IServiceContainer } from '../../ioc/types';
import { sendTelemetryEvent } from '../../telemetry';
import { EventName } from '../../telemetry/constants';
import { DiagnosticCodes } from './constants';
import { DiagnosticScope, IDiagnostic, IDiagnosticFilterService, IDiagnosticsService } from './types';

@injectable()
export abstract class BaseDiagnostic implements IDiagnostic {
    constructor(public readonly code: DiagnosticCodes, public readonly message: string,
        public readonly severity: DiagnosticSeverity, public readonly scope: DiagnosticScope,
        public readonly resource: Resource) { }
}

export function clearCacheForTesting() {
    if (!isUnitTestExecution()) {
        throw new Error('Feature Not available when not testing');
    }
    while (handledKeys.length > 0) {
        handledKeys.shift();
    }
}

const handledKeys: string[] = [];

@injectable()
export abstract class BaseDiagnosticsService implements IDiagnosticsService {
    protected readonly filterService: IDiagnosticFilterService;
    constructor(
        @unmanaged() private readonly supportedDiagnosticCodes: string[],
        @unmanaged() protected serviceContainer: IServiceContainer
    ) {
        this.filterService = serviceContainer.get<IDiagnosticFilterService>(IDiagnosticFilterService);
    }
    public abstract diagnose(resource: Resource): Promise<IDiagnostic[]>;
    public abstract onHandle(diagnostics: IDiagnostic[]): Promise<void>;
    public async handle(diagnostics: IDiagnostic[]): Promise<void> {
        if (diagnostics.length === 0) {
            return;
        }
        const diagnosticsToHandle = diagnostics.filter(item => {
            const key = this.getDiagnosticsKey(item);
            if (handledKeys.indexOf(key) !== -1) {
                return false;
            }
            handledKeys.push(key);
            return true;
        });
        await this.handle(diagnosticsToHandle);
    }
    public async canHandle(diagnostic: IDiagnostic): Promise<boolean> {
        sendTelemetryEvent(EventName.DIAGNOSTICS_MESSAGE, undefined, { code: diagnostic.code });
        return this.supportedDiagnosticCodes.filter(item => item === diagnostic.code).length > 0;
    }
    /**
     * Returns a key used to keep track of whether a diagnostic was handled or not.
     * So as to prevent handling/displaying messages multiple times for the same diagnostic.
     *
     * @protected
     * @param {IDiagnostic} diagnostic
     * @returns {string}
     * @memberof BaseDiagnosticsService
     */
    protected getDiagnosticsKey(diagnostic: IDiagnostic): string {
        if (diagnostic.scope === DiagnosticScope.Global) {
            return diagnostic.code;
        }
        const workspace = this.serviceContainer.get<IWorkspaceService>(IWorkspaceService);
        const workspaceFolder = workspace.getWorkspaceFolder(diagnostic.resource);
        return `${diagnostic.code}${workspaceFolder ? workspaceFolder.uri.fsPath : ''}`;
    }
}
