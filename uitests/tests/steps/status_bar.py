# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import behave
import tests


@behave.then(
    'the python interpreter displayed in the the status bar contains the value "{name}" in the tooltip'
)
def then_selected_interpreter_has_tooltip(context, name):
    element = tests.vscode.status_bar.wait_for_python_statusbar(context)
    assert name in element.get_attribute('title')


@behave.then(
    'the python interpreter displayed in the the status bar contains the value "{name}" in the display name'
)
def then_selected_interpreter_has_text(context, name):
    element = tests.vscode.status_bar.wait_for_python_statusbar(context)
    assert name in element.text
