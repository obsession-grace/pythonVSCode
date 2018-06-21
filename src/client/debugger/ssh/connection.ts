// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Disposable } from 'vscode';
import { createDeferred } from '../../common/helpers';
import { ConnectConfig } from 'ssh2'
import { injectable } from '../../../../node_modules/inversify';
const tunnel = require('tunnel-ssh');

export const ISshConnection = Symbol('ISshConnection');
export interface ISshConnection extends Disposable {
    readonly id: string;
}

export const ISshConnections = Symbol('ISshConnections');
export interface ISshConnections extends Disposable {
    add(connection: ISshConnection): void;
    remove(connection: ISshConnection): void;
}

@injectable()
export class SshConnections implements ISshConnections {
    private readonly connections: ISshConnection[] = [];
    public add(connection: ISshConnection): void {
        if (this.connections.findIndex(conn => conn.id === connection.id) === -1) {
            this.connections.push(connection);
        }
    }
    public remove(connection: ISshConnection): void {
        connection.dispose();
        const index = this.connections.findIndex(conn => conn.id === connection.id);
        if (index >= 0) {
            this.connections.splice(index, 1);
        }
    }
    public dispose() {
        this.connections.forEach(connection => {
            connection.dispose();
        });
    }
}

export type SshTunnelConnectionConfig = ConnectConfig & { dstPort: number, localPort: number };

export const ISshTunnelService = Symbol('ISshTunnelService');
export interface ISshTunnelService {
    connect(config: SshTunnelConnectionConfig): Promise<ISshConnection>;
}

@injectable()
export class SshTunnelService implements ISshTunnelService {
    public connect(config: SshTunnelConnectionConfig): Promise<ISshConnection> {
        const deferred = createDeferred<ISshConnection>();
        tunnel(config, (error, server) => {
            if (error) {
                return deferred.reject(error);
            }

            deferred.resolve({
                id: new Date().getTime().toString(),
                dispose: () => {
                    server.close();
                }
            })
        });

        return deferred.promise;
    }
}
