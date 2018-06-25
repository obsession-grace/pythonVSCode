// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { EventEmitter } from 'events';
import { ConnectConfig } from 'ssh2';
import { Disposable } from 'vscode';
import { injectable } from '../../../../node_modules/inversify';
import { createDeferred } from '../../common/helpers';
// tslint:disable-next-line:no-require-imports no-var-requires
const tunnel = require('tunnel-ssh');

export const ISshConnection = Symbol('ISshConnection');
export interface ISshConnection extends Disposable {
    readonly id: string;
    on(event: 'error', listener: Function): void;
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

export type SshTunnelConnectionConfig = ConnectConfig & { dstPort: number; localPort: number };

export const ISshTunnelService = Symbol('ISshTunnelService');
export interface ISshTunnelService {
    connect(config: SshTunnelConnectionConfig): Promise<ISshConnection>;
}

export class SshConnection extends EventEmitter implements ISshConnection {
    constructor(public readonly id: string, private server: { close: Function; on(event: 'error', listener: Function): void }) {
        super();
        this.server.on('error', error => this.emit('error', error));
    }
    public dispose() {
        this.server.close();
    }
}
@injectable()
export class SshTunnelService implements ISshTunnelService {
    public connect(config: SshTunnelConnectionConfig): Promise<ISshConnection> {
        const deferred = createDeferred<ISshConnection>();
        tunnel(config, (error, server) => {
            if (error) {
                return deferred.reject(error);
            }

            const connectionId = new Date().getTime().toString();
            deferred.resolve(new SshConnection(connectionId, server));
        });

        return deferred.promise;
    }
}
