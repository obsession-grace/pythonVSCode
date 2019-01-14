// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject } from 'inversify';
import { traceDecorators } from '../../common/logger';
import { IDisposable, Resource } from '../../common/types';
import { debounce } from '../../common/utils/decorators';
import { IServiceContainer } from '../../ioc/types';
import { captureTelemetry } from '../../telemetry';
import { PYTHON_LANGUAGE_SERVER_STARTUP } from '../../telemetry/constants';
import { ILanaguageServer, ILanguageServerAnalysisOptions, ILanguageServerManager } from '../types';

export class LanguageServerManager implements ILanguageServerManager {
    private lanaguageServer?: ILanaguageServer;
    private resource!: Resource;
    private disposables: IDisposable[] = [];
    constructor(
        @inject(IServiceContainer) private readonly serviceContainer: IServiceContainer,
        @inject(ILanguageServerAnalysisOptions) private readonly analysisOptions: ILanguageServerAnalysisOptions) { }
    public dispose() {
        if (this.lanaguageServer) {
            this.lanaguageServer.dispose();
        }
    }
    @traceDecorators.error('Failed to start Language Server')
    public async start(resource: Resource): Promise<void> {
        if (this.lanaguageServer) {
            throw new Error('Language Server already started');
        }
        this.resource = resource;
        this.analysisOptions.onDidChange(this.restartLanguageServer, this, this.disposables);

        await this.analysisOptions.initialize(resource);
        await this.startLanguageServer();
    }
    @traceDecorators.error('Failed to restart Language Server')
    @traceDecorators.verbose('Restarting Langauge Server')
    @debounce(1000)
    protected async restartLanguageServer(): Promise<void> {
        if (this.lanaguageServer) {
            this.lanaguageServer.dispose();
        }
        await this.startLanguageServer();
    }
    @captureTelemetry(PYTHON_LANGUAGE_SERVER_STARTUP, undefined, true)
    @traceDecorators.verbose('Starting Langauge Server')
    protected async startLanguageServer(): Promise<void> {
        this.lanaguageServer = this.serviceContainer.get<ILanaguageServer>(ILanaguageServer);
        const options = await this.analysisOptions!.getAnalysisOptions();
        await this.lanaguageServer.start(this.resource, options);
    }
}
