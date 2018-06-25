// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as getFreePort from 'get-port';
import { inject, injectable } from 'inversify';
import * as net from 'net';
import { debug, Uri } from 'vscode';
import { IApplicationShell } from '../../common/application/types';
import { noop } from '../../common/core.utils';
import { ICurrentProcess, ILogger } from '../../common/types';
import { IServiceContainer } from '../../ioc/types';
import { AttachRequestArguments, LaunchRequestArguments } from '../Common/Contracts';
import { BaseConfigurationProvider, PythonAttachDebugConfiguration, PythonLaunchDebugConfiguration } from '../configProviders/baseProvider';
import { ISshConnections, ISshTunnelService, SshTunnelConnectionConfig } from './connection';
import { resolve } from 'url';
import { readJson } from '../../../../node_modules/@types/fs-extra';

@injectable()
export class ConnectionDebugConfigurationProvider extends BaseConfigurationProvider<LaunchRequestArguments, AttachRequestArguments> {
    constructor(@inject(IServiceContainer) serviceContainer: IServiceContainer) {
        super('pythonExperimental', serviceContainer);
    }

    public async provideLaunchDefaults(_: Uri, __: PythonLaunchDebugConfiguration<LaunchRequestArguments>): Promise<void> {
        noop();
    }
    public async provideAttachDefaults(_: Uri | undefined, debugConfiguration: PythonAttachDebugConfiguration<AttachRequestArguments>): Promise<void> {
        if (debugConfiguration.ssh && Object.keys(debugConfiguration.ssh).length > 0) {
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
            debugConfiguration.ssh.connectionId = connection.id;
            connections.add(connection);

            // tslint:disable-next-line:promise-must-complete
            await new Promise((res, rej) => {
                debugger;
                const client = net.createConnection(config.localPort, 'localhost', () => {
                    debugger;
                    client.end();
                    res();
                });
                client.on('error', ex => {
                    debugger;
                    rej();
                });
            });
            connection.on('error', err => {
                if (debug.activeDebugSession &&
                    debug.activeDebugSession.type === debugConfiguration.type &&
                    debug.activeDebugSession.name === debugConfiguration.name) {
                    debug.activeDebugSession.customRequest('terminated');
                    debug.activeDebugSession.customRequest('disconnect');
                }
            });
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
            username: debugConfiguration.ssh.userName,
            host: debugConfiguration.ssh.host,
            dstPort: debugConfiguration.ssh.port,
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
                placeHolder: 'username@server',
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
            } else {
                return;
            }
        }

        return config;
    }
}
