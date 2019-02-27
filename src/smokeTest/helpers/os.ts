// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

export enum OSType {
    OSX = 'OSX',
    Linux = 'Linux',
    Windows = 'Windows'
}

export function getOSType(): OSType {
    if (/^win/.test(process.platform)) {
        return OSType.Windows;
    } else if (/^darwin/.test(process.platform)) {
        return OSType.OSX;
    } else if (/^linux/.test(process.platform)) {
        return OSType.Linux;
    } else {
        throw new Error('Unknown OS');
    }
}
