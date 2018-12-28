// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Event, EventEmitter} from 'vscode';
import { Resource } from '../../client/common/types';
import { IInterpreterAutoSeletionService } from '../../client/interpreter/autoSelection/types';

export class MockAutoSelectionService implements IInterpreterAutoSeletionService {
    get onDidChangeAutoSelectedInterpreter(): Event<void> {
        return new EventEmitter<void>().event;
    }
    public autoSelectInterpreter(resource: Resource): Promise<void> {
        return Promise.resolve();
    }
    public getAutoSelectedInterpreter(resource: Resource): string | undefined {
        return;
    }
}
