// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as path from 'path';
import { Application } from '../application';

// tslint:disable: no-any

export interface IContext {
    app: Application;
    resolveFilePath(relativeFilePath: string): string;
}
class Context implements IContext {
    public app!: Application;
    public resolveFilePath(relativeFilePath: string): string {
        return path.resolve(this.app.workspacePathOrFolder, relativeFilePath);
    }
}
export const context: IContext = new Context();
