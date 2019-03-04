// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { context } from '../steps/app';

const messageBoxSelector = 'div.notifications-toasts.visible div.notification-toast-container div.notification-list-item-message span';
const firstMessageBoxCloseSelector = 'div.notifications-toasts.visible div.notification-toast-container:nth-child(1) a.action-label.icon.clear-notification-action';

export async function hasMessages(): Promise<boolean> {
    try {
        await context.app.code.waitForElement('div.notifications-toasts.visible', undefined, 0);
        return true;
    } catch {
        return false;
    }
}
export async function getMessages(): Promise<string[]> {
    if (!await hasMessages()) {
        return [];
    }
    const elements = await context.app.code.waitForElements(messageBoxSelector, true);
    return elements.map(item => item.textContent);
}

export async function closeMessages() {
    await context.app.workbench.quickopen.runCommand('Notifications: Clear All Notifications');
}
