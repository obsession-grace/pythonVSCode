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
    start_time = time.time()
    while time.time() - start_time < 5:
        _expand_nodes(context)
        if get_node_count(context) > 1:
            return
        time.sleep(0.1)
    else:
        raise TimeoutError("Timeout waiting to expand all nodes")


def _expand_nodes(context):
    tree = uitests.vscode.core.wait_for_element(
        context.driver, ".monaco-tree.monaco-tree-instance-2"
    )
    tree.click()
    tree.send_keys(Keys.DOWN)
    # for i in range(2, 20):
    i = 2
    total_tries = 0
    while True:
        total_tries = total_tries + 1
        if total_tries > 100:
            raise SystemError("Failed to expand all nodes")
        tree.send_keys(Keys.RIGHT)
        time.sleep(0.2)
        tree.send_keys(Keys.DOWN)
        selector = (
            f"div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child({i})"
        )
        try:
            parent_selector = f"div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child({i-1})"
            parent_element = context.driver.find_element_by_css_selector(
                parent_selector
            )
            css_class = parent_element.get_attribute("class")
            if "has-children" in css_class and "expanded" not in css_class:
                i = 0
                continue
        except Exception:
            return
        try:
            element = context.driver.find_element_by_css_selector(selector)
            i = i + 1
        except Exception:
            return


def get_root_node(context):
    selector = "div[id='workbench.view.extension.test'] .monaco-tree-row:nth-child(1)"
    return uitests.vscode.core.wait_for_element(context.driver, selector)
