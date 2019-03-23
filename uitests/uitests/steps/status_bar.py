# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import time

import behave
from selenium.common.exceptions import StaleElementReferenceException

import uitests.vscode.status_bar


@behave.then(
    'the python interpreter displayed in the the status bar contains the value "{name}" in the tooltip'
)
def then_selected_interpreter_has_tooltip(context, name):
    start_time = time.time()
    while time.time() - start_time < 5:
        element = uitests.vscode.status_bar.wait_for_python_statusbar(context)
        try:
            assert name in element.get_attribute("title")
        except (AssertionError, StaleElementReferenceException):
            time.sleep(0.5)
            pass
    assert name in element.get_attribute("title")


@behave.then(
    'the python interpreter displayed in the the status bar contains the value "{name}" in the display name'
)
def then_selected_interpreter_has_text(context, name):
    start_time = time.time()
    while time.time() - start_time < 5:
        element = uitests.vscode.status_bar.wait_for_python_statusbar(context)
        try:
            assert name in element.text
        except (AssertionError, StaleElementReferenceException):
            time.sleep(0.5)
            pass
    assert name in element.text