# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import time

import behave
from selenium.webdriver.common.keys import Keys

import uitests.vscode.core


def wait_for_explorer_icon(context):
    selector = ".activitybar.left .actions-container a[title='Test']"
    uitests.vscode.core.wait_for_element(context.driver, selector)


def wait_for_stop_icon(context):
    selector = "div[id='workbench.parts.sidebar'] .action-item a[title='Stop']"
    uitests.vscode.core.wait_for_element(context.driver, selector)


def wait_for_stop_hidden(context):
    selector = "div[id='workbench.parts.sidebar'] .action-item a[title='Stop']"
    uitests.vscode.core.wait_for_element_to_be_hidden(context.driver, selector)


def stop(context):
    selector = "div[id='workbench.parts.sidebar'] .action-item a[title='Stop']"
    element = uitests.vscode.core.wait_for_element(context.driver, selector)
    element.click()


def get_node_count(context):
    selector = "div[id='workbench.view.extension.test'] .monaco-tree-row"
    return len(list(uitests.vscode.core.wait_for_elements(context.driver, selector)))


def get_node_icons(context):
    selector = "div[id='workbench.view.extension.test'] .monaco-tree-row .custom-view-tree-node-item-icon"
    return uitests.vscode.core.wait_for_elements(context.driver, selector)


def get_node_icon(context, number):
    selector = f"div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child({number}) .custom-view-tree-node-item-icon"
    return uitests.vscode.core.wait_for_element(context.driver, selector)


def get_node(context, number):
    selector = (
        f"div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child({number})"
    )
    return uitests.vscode.core.wait_for_elements(context.driver, selector)


def _select_node(context, number):
    tree = uitests.vscode.core.wait_for_element(
        context.driver, ".monaco-tree.monaco-tree-instance-2"
    )
    tree.click()
    for _ in range(number):
        tree.send_keys(Keys.DOWN)


def click_node(context, number):
    tree = uitests.vscode.core.wait_for_element(
        context.driver, ".monaco-tree.monaco-tree-instance-2"
    )
    tree.click()
    for _ in range(number):
        tree.send_keys(Keys.DOWN)
        tree.send_keys(Keys.ENTER)


def click_node_action_item(context, number, tooltip):
    expand_nodes(context)
    _select_node(context, number)
    action = _get_action_item(context, number, tooltip)
    action.click()


def _get_action_item(context, number, tooltip):
    selector = f"div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child({number}) .actions .action-item a.action-label.icon[title='{tooltip}']"
    return context.driver.find_element_by_css_selector(selector)


def expand_nodes(context):
    time.sleep(0.1)
    for _ in range(5):
        _expand_nodes(context)
        if get_node_count(context) > 1:
            return


def _expand_nodes(context):
    tree = uitests.vscode.core.wait_for_element(
        context.driver, ".monaco-tree.monaco-tree-instance-2"
    )
    tree.click()
    tree.send_keys(Keys.DOWN)
    for i in range(2, 20):
        tree.send_keys(Keys.RIGHT)
        tree.send_keys(Keys.DOWN)
        selector = (
            f"div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child({i})"
        )
        try:
            context.driver.find_element_by_css_selector(selector)
        except Exception:
            return


def get_root_node(context):
    selector = "div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child(1)"
    return uitests.vscode.core.wait_for_element(context.driver, selector)
