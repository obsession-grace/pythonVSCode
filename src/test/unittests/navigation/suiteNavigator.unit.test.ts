// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { expect, use } from 'chai';
import * as chaisAsPromised from 'chai-as-promised';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import * as typemoq from 'typemoq';
import {
    Location,
    Range,
    SymbolInformation,
    SymbolKind,
    TextDocument,
    TextEditor,
    TextEditorRevealType,
    Uri
} from 'vscode';
import { TestNavigatorHelper } from '../../../client/unittests/navigation/helper';
import { TestSuiteCodeNavigator } from '../../../client/unittests/navigation/suiteNavigator';
import { ITestNavigatorHelper } from '../../../client/unittests/navigation/types';

use(chaisAsPromised);

// tslint:disable:max-func-body-length no-any
suite('Unit Tests - Navigation Suite', () => {
    let navigator: TestSuiteCodeNavigator;
    let helper: ITestNavigatorHelper;
    let doc: typemoq.IMock<TextDocument>;
    let editor: typemoq.IMock<TextEditor>;
    setup(() => {
        doc = typemoq.Mock.ofType<TextDocument>();
        editor = typemoq.Mock.ofType<TextEditor>();
        helper = mock(TestNavigatorHelper);
        navigator = new TestSuiteCodeNavigator(instance(helper));
    });
    test('Ensure file is opened', async () => {
        const filePath = Uri.file('some file Path');
        when(helper.openFile(anything())).thenResolve([doc.object, editor.object]);

        await navigator.navigateTo({ file: filePath.fsPath } as any);

        verify(helper.openFile(anything())).once();
        expect(capture(helper.openFile).first()[0]!.fsPath).to.equal(filePath.fsPath);
    });
    test('Ensure errors are propogated', async () => {
        const filePath = Uri.file('some file Path');
        when(helper.openFile(anything())).thenReject(new Error('kaboom'));

        const promise = navigator.navigateTo({ file: filePath.fsPath } as any);

        verify(helper.openFile(anything())).once();
        expect(capture(helper.openFile).first()[0]!.fsPath).to.equal(filePath.fsPath);
        await expect(promise).to.eventually.be.rejected;
    });
    test('Ensure we use line number from test suite when navigating in file', async () => {
        const filePath = Uri.file('some file Path');
        const line = 999;
        when(helper.openFile(anything())).thenResolve([doc.object, editor.object]);
        const range = new Range(line, 0, line + 1, 0);
        const symbol: SymbolInformation = {
            containerName: '',
            kind: SymbolKind.Class,
            name: 'suite_name',
            location: new Location(Uri.file(__filename), range)
        };
        when(helper.findSymbol(doc.object, anything(), anything())).thenResolve(symbol);

        await navigator.navigateTo({ file: filePath.fsPath, name: 'suite_name' } as any);

        verify(helper.openFile(anything())).once();
        verify(helper.findSymbol(doc.object, anything(), anything())).once();
        expect(capture(helper.openFile).first()[0]!.fsPath).to.equal(filePath.fsPath);
        editor.verify(e => e.revealRange(range, TextEditorRevealType.Default), typemoq.Times.once());
    });
    test('Ensure we use line number from test suite when navigating in file', async () => {
        const filePath = Uri.file('some file Path');
        const line = 999;
        when(helper.openFile(anything())).thenResolve([doc.object, editor.object]);
        const range = new Range(line, 0, line + 1, 0);

        await navigator.navigateTo({ file: filePath.fsPath, line } as any);

        verify(helper.openFile(anything())).once();
        verify(helper.findSymbol(anything(), anything(), anything())).never();
        expect(capture(helper.openFile).first()[0]!.fsPath).to.equal(filePath.fsPath);
        editor.verify(e => e.revealRange(range, TextEditorRevealType.Default), typemoq.Times.once());
    });
    test('Ensure file is opened and range not revealed', async () => {
        const filePath = Uri.file('some file Path');
        when(helper.openFile(anything())).thenResolve([doc.object, editor.object]);
        const search = { kind: SymbolKind.Class, name: 'Hello' };
        when(helper.findSymbol(doc.object, search, anything())).thenResolve();

        await navigator.navigateTo({ file: filePath.fsPath } as any);

        verify(helper.openFile(anything())).once();
        expect(capture(helper.openFile).first()[0]!.fsPath).to.equal(filePath.fsPath);
        editor.verify(e => e.revealRange(typemoq.It.isAny(), typemoq.It.isAny()), typemoq.Times.never());
    });
});
