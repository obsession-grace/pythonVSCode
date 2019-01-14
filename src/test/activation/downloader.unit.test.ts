// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-any

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { LanguageServerDownloader } from '../../client/activation/downloader';
import { ILanguageServerFolderService } from '../../client/activation/types';

suite('Activation - Downloader', () => {
    let languageServerDownloader: LanguageServerDownloader;
    let folderService: TypeMoq.IMock<ILanguageServerFolderService>;
    setup(() => {
        folderService = TypeMoq.Mock.ofType<ILanguageServerFolderService>();
        languageServerDownloader = new LanguageServerDownloader(undefined as any,
            undefined as any, undefined as any,
            folderService.object, undefined as any);
    });

    test('Get download uri', async () => {
        const pkg = { uri: 'xyz' } as any;
        folderService
            .setup(f => f.getLatestLanguageServerVersion())
            .returns(() => Promise.resolve(pkg))
            .verifiable(TypeMoq.Times.once());

        const info = await languageServerDownloader.getDownloadInfo();

        folderService.verifyAll();
        expect(info).to.deep.equal(pkg);
    });
});
