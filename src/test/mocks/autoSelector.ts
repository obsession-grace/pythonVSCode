// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable } from 'inversify';
import { Event, EventEmitter } from 'vscode';
import { Resource } from '../../client/common/types';
import { IInterpreterAutoSeletionProxyService, IInterpreterAutoSeletionService } from '../../client/interpreter/autoSelection/types';
import { noop } from '../core';

@injectable()
export class MockAutoSelectionService implements IInterpreterAutoSeletionService, IInterpreterAutoSeletionProxyService {
    get onDidChangeAutoSelectedInterpreter(): Event<void> {
        return new EventEmitter<void>().event;
    }
    public autoSelectInterpreter(_resource: Resource): Promise<void> {
        return Promise.resolve();
    }
    public getAutoSelectedInterpreter(_resource: Resource): string | undefined {
        return;
    }
    public registerInstance(_instance: IInterpreterAutoSeletionProxyService): void {
        noop();
    }
}
