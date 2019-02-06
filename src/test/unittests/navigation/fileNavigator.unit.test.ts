// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { expect, use } from 'chai';
import * as chaisAsPromised from 'chai-as-promised';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { Uri } from 'vscode';
import { TestFileCodeNavigator } from '../../../client/unittests/navigation/fileNavigator';
import { TestNavigatorHelper } from '../../../client/unittests/navigation/helper';
import { ITestNavigatorHelper } from '../../../client/unittests/navigation/types';

use(chaisAsPromised);

// tslint:disable:max-func-body-length no-any
suite('Unit Tests - Navigation File', () => {
    let navigator: TestFileCodeNavigator;
    let helper: ITestNavigatorHelper;
    setup(() => {
        helper = mock(TestNavigatorHelper);
        navigator = new TestFileCodeNavigator(instance(helper));
    });
    test('Ensure file is opened', async () => {
        const filePath = Uri.file('some file Path');
        when(helper.openFile(anything())).thenResolve();

        await navigator.navigateTo({ file: filePath.fsPath } as any);

        verify(helper.openFile(anything())).once();
        expect(capture(helper.openFile).first()[0]!.fsPath).to.equal(filePath.fsPath);
    });
    test('Ensure errors are propogated', async () => {
        const filePath = Uri.file('some file Path');
        when(helper.openFile(anything())).thenReject(new Error('kaboom'));

        const promise = navigator.navigateTo({ file: filePath.fsPath } as any);

        verify(helper.openFile(anything())).once();
        await expect(promise).to.eventually.be.rejected;
        expect(capture(helper.openFile).first()[0]!.fsPath).to.equal(filePath.fsPath);
    });
});
