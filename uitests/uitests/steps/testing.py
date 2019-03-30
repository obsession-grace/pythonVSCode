# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import time

import behave

import uitests.vscode.testing
import uitests.tools

node_status_icon_mapping = {
    "UNKNOWN": "status-unknown.svg",
    "SKIP": "status-unknown.svg",
    "PROGRESS": "discovering-tests.svg",
    "OK": "status-ok.svg",
    "PASS": "status-ok.svg",
    "SUCCESS": "status-ok.svg",
    "FAIL": "status-error.svg",
    "ERROR": "status-error.svg",
}


@behave.then("the test explorer icon will be visible")
def icon_visible(context):
    uitests.vscode.testing.wait_for_explorer_icon(context)


@behave.when("I run the test node number {number:Number}")
def run_node(context, number):
    uitests.vscode.testing.click_node_action_item(context, number, "Run")


@behave.when("I debug the test node number {number:Number}")
def debug_node(context, number):
    uitests.vscode.testing.click_node_action_item(context, number, "Debug")


@behave.when("I navigate to the code associated with test node number {number:Number}")
def navigate_node(context, number):
    uitests.vscode.testing.click_node_action_item(context, number, "Open")


@behave.then("there are {count:Number} nodes in the tree")
def explorer_node_count(context, count):
    total_count = uitests.vscode.testing.get_node_count(context)
    assert total_count == count


@behave.when("I expand all of the test tree nodes")
def explorer_expand_nodes(context):
    uitests.vscode.testing.expand_nodes(context)


@behave.when("I click node number {number:Number}")
def click_node(context, number):
    uitests.vscode.testing.click_node(context, number)


@behave.then("all of the test tree nodes have an unknown icon")
def all_unknown(context):
    icons = uitests.vscode.testing.get_node_icons(context)
    assert all("status-unknown.svg" in icon.get_attribute("style") for icon in icons)


@behave.then('the node number {number:Number} has a status of "{status}"')
@uitests.tools.retry(AssertionError)
def node_status(context, number, status):
    icon = uitests.vscode.testing.get_node_icon(context, number)
    assert node_status_icon_mapping.get(
        status.upper(), ""
    ) in icon.get_attribute("style")

    # icon = uitests.vscode.testing.get_node_icon(context, number)
    # start_time = time.time()
    # while time.time() - start_time < 5:
    #     try:
    #         assert node_status_icon_mapping.get(
    #             status.upper(), ""
    #         ) in icon.get_attribute("style")
    #         return
    #     except AssertionError:
    #         time.sleep(0.1)
    # else:
    #     raise SystemError(f"Status of node {number} is not {status}")


@behave.then('{number:Number} nodes have a status of "{status}"')
def node_count_status(context, number, status):
    check_node_count_status(context, number, status)


@behave.then('1 node has a status of "{status}"')
def node_one_status(context, status):
    check_node_count_status(context, 1, status)


@behave.then("all of the test tree nodes have a progress icon")
def all_progress(context):
    icons = uitests.vscode.testing.get_node_icons(context)
    assert all("discovering-tests.svg" in icon.get_attribute("style") for icon in icons)


@behave.then("the stop icon is visible in the toolbar")
def stop_icon_visible(context):
    uitests.vscode.testing.wait_for_stop_icon(context)


@behave.then("the stop icon is not visible in the toolbar")
def stop_icon_not_visible(context):
    uitests.vscode.testing.wait_for_stop_hidden(context)


@behave.when("I wait for tests to complete running")
def wait_for_run_to_complete(context):
    uitests.vscode.testing.wait_for_stop_hidden(context)


@behave.when("I wait for tests discovery to complete")
def wait_for_discovery_to_complete(context):
    uitests.vscode.testing.wait_for_stop_hidden(context)


@behave.when("I stop discovering tests")
def when_stop_discovering(context):
    uitests.vscode.testing.stop(context)


@behave.when("I stop running tests")
def when_stop_running(context):
    uitests.vscode.testing.stop(context)


@behave.then("stop discovering tests")
def then_stop_discovering(context):
    uitests.vscode.testing.stop(context)


def check_node_count_status(context, number, status):
    icon_name = node_status_icon_mapping.get(status.upper(), "")
    icons = uitests.vscode.testing.get_node_icons(context)
    assert (
        len(list(icon for icon in icons if icon_name in icon.get_attribute("style")))
        == number
    )
