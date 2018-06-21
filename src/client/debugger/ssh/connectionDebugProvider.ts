// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { Uri, DebugConfigurationProvider, CancellationToken, DebugConfiguration, WorkspaceFolder } from 'vscode';
import { IPlatformService } from '../../common/platform/types';
import { IServiceContainer } from '../../ioc/types';
import { sendTelemetryEvent } from '../../telemetry';
import { DEBUGGER } from '../../telemetry/constants';
import { DebuggerTelemetryV2 } from '../../telemetry/types';
import { AttachRequestArguments, DebugOptions, LaunchRequestArguments } from '../Common/Contracts';
import { BaseConfigurationProvider, PythonLaunchDebugConfiguration, PythonAttachDebugConfiguration } from '../configProviders/baseProvider';
import { IApplicationShell } from '../../common/application/types';
import { ConnectConfig } from 'ssh2';
import { ICurrentProcess, ILogger } from '../../common/types';
import * as getFreePort from 'get-port';
import { ISshConnections, ISshTunnelService, SshTunnelConnectionConfig } from './connection';

@injectable()
export class ConnectionDebugConfigurationProvider {
    // export class ConnectionDebugConfigurationProvider extends BaseConfigurationProvider<LaunchRequestArguments, AttachRequestArguments> {
    constructor(private serviceContainer: IServiceContainer) {
    }

    public async provideAttachDefaults(workspaceFolder: Uri | undefined, debugConfiguration: PythonAttachDebugConfiguration<AttachRequestArguments>): Promise<void> {
        if (debugConfiguration.useSsh) {
            await this.setupSshTunnel(debugConfiguration);
        }
    }
    private async setupSshTunnel(debugConfiguration: PythonAttachDebugConfiguration<AttachRequestArguments>) {
        try {
            const connections = this.serviceContainer.get<ISshConnections>(ISshConnections);
            const sshTunnel = this.serviceContainer.get<ISshTunnelService>(ISshTunnelService);
            const config = await this.getConnectionInfo(debugConfiguration);
            if (!config) {
                return;
            }
            const connection = await sshTunnel.connect(config);
            debugConfiguration.sshConnectionId = connection.id;
            connections.add(connection);
        } catch (ex) {
            const logger = this.serviceContainer.get<ILogger>(ILogger);
            logger.logError('Failed to setup SSH Tunne', ex);
            return;
        }
    }
    private async getConnectionInfo(debugConfiguration: PythonAttachDebugConfiguration<AttachRequestArguments>): Promise<SshTunnelConnectionConfig> {
        const localPort = await getFreePort({ host: 'localhost' });
        debugConfiguration.port = localPort;
        const config: SshTunnelConnectionConfig = {
            username: debugConfiguration.sshUserName,
            password: debugConfiguration.sshPassword,
            host: debugConfiguration.sshRemoteHost,
            dstPort: debugConfiguration.sshRemotePort,
            localPort
        };

        const appShell = this.serviceContainer.get<IApplicationShell>(IApplicationShell);
        if (!config.username || !config.host) {
            const currentProcess = this.serviceContainer.get<ICurrentProcess>(ICurrentProcess);
            const defaultUserName = currentProcess.env.TUNNELSSH_USER || currentProcess.env.USER || currentProcess.env.USERNAME || 'root';
            const value = `${defaultUserName}@servername`;
            const validation = (val: string): string => {
                if (val && val.indexOf('@') === -1) {
                    return 'Please enter the user name and server in the form of \'username@servername\'';
                }
                return '';
            };
            const auth = await appShell.showInputBox({
                prompt: 'Enter User Name and Server',
                placeHolder: 'username@server ',
                value,
                ignoreFocusOut: true,
                validateInput: validation
            });
            if (!auth) {
                return;
            }
            config.username = auth.split('@')[0];
            config.host = auth.split('@')[1];
        }
        if (!config.password) {
            config.password = await appShell.showInputBox({ prompt: 'Enter Password', placeHolder: 'ssh password', ignoreFocusOut: true });
            if (!config.password) {
                return;
            }
        }
        if (!config.dstPort) {
            const validation = (val: string): string => {
                if (val && isNaN(parseInt(val, 10))) {
                    return 'Please a valid port';
                }
                return '';
            };
            const port = await appShell.showInputBox({ prompt: 'Enter Remote Debug Port', placeHolder: '5678', value: '5678', ignoreFocusOut: true });
            if (port && !isNaN(parseInt(port, 10))) {
                config.dstPort = parseInt(port, 10);
            }
            else {
                return;
            }
        }

        return config;
    }
}
