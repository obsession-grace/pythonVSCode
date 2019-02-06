// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import {
    CancellationToken,
    DocumentSymbolProvider,
    SymbolInformation,
    SymbolKind,
    TextDocument,
    TextEditor,
    Uri
} from 'vscode';
import { IDisposable } from '../../common/types';
import { TestFile, TestFunction, TestSuite } from '../common/types';

export const ITestCodeNavigatorCommandHandler = Symbol('ITestCodeNavigatorCommandHandler');
export interface ITestCodeNavigatorCommandHandler extends IDisposable {
    register(): void;
}
export type NavigableItem = TestFile | TestFunction | TestSuite;
export enum NavigableItemType {
    testFile = 'testFile',
    testFunction = 'testFunction',
    testSuite = 'testSuite'
}

export const ITestCodeNavigator = Symbol('ITestCodeNavigator');
export interface ITestCodeNavigator {
    navigateTo(item: NavigableItem): Promise<void>;
}

export const ITestNavigatorHelper = Symbol('ITestNavigatorHelper');
export interface ITestNavigatorHelper {
    registerSymbolProvider(symbolProvider: DocumentSymbolProvider);
    openFile(file?: Uri): Promise<[TextDocument, TextEditor]>;
    findSymbol(
        doc: TextDocument,
        search: SymbolSearch,
        token: CancellationToken
    ): Promise<SymbolInformation | undefined>;
}
export type SymbolSearch = {
    name: string;
    kind: SymbolKind;
};
