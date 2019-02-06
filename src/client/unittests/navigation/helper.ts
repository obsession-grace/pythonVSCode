// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { CancellationToken, DocumentSymbolProvider, SymbolInformation, TextDocument, TextEditor, Uri } from 'vscode';
import { IDocumentManager } from '../../common/application/types';
import { traceError } from '../../common/logger';
import { ITestNavigatorHelper, SymbolSearch } from './types';

@injectable()
export class TestNavigatorHelper implements ITestNavigatorHelper {
    private symbolProvider?: DocumentSymbolProvider;
    constructor(@inject(IDocumentManager) private readonly documentManager: IDocumentManager) {}
    public registerSymbolProvider(symbolProvider: DocumentSymbolProvider) {
        this.symbolProvider = symbolProvider;
    }
    public async openFile(file?: Uri): Promise<[TextDocument, TextEditor]> {
        if (!file) {
            throw new Error('Unable to navigate to an undefined test file');
        }
        const doc = await this.documentManager.openTextDocument(file);
        const editor = await this.documentManager.showTextDocument(doc);
        return [doc, editor];
    }
    public async findSymbol(doc: TextDocument, search: SymbolSearch, token: CancellationToken): Promise<SymbolInformation | undefined> {
        if (!this.symbolProvider) {
            traceError('Symbol information requested too early', new Error('Test file symbols requested too early'));
            return;
        }
        const symbols = (await this.symbolProvider.provideDocumentSymbols(doc, token)) as SymbolInformation[];
        if (!Array.isArray(symbols) || symbols.length === 0) {
            return;
        }
        return symbols.find(s => s.kind === search.kind && s.name === search.name);
    }
}
