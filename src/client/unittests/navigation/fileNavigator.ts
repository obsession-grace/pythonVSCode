// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { TestFile } from '../common/types';
import { ITestCodeNavigator, ITestNavigatorHelper } from './types';

@injectable()
export class TestFileCodeNavigator implements ITestCodeNavigator {
    constructor(@inject(ITestNavigatorHelper) private readonly helper: ITestNavigatorHelper) {}
    public async navigateTo(item: TestFile): Promise<void> {
        await this.helper.openFile(item.file);
    }
}
