# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import behave
import uitests.vscode.quick_input
import uitests.vscode.quick_open
import os.path


@behave.given('a Python Interpreter containing the name "{name}" is selected')
def given_select_interpreter_with_name(context, name):
    uitests.vscode.quick_open.select_command(context, "Python: Select Interpreter")
    uitests.vscode.quick_input.select_value(context, name)


@behave.given("a generic Python Interpreter is selected")
def given_select_generic_interpreter(context, name):
    uitests.vscode.quick_open.select_command(context, "Python: Select Interpreter")
    uitests.vscode.quick_input.select_value(context, name)


@behave.when('I select the Python Interpreter containing the name "{name}"')
def when_select_interpreter_with_name(context, name):
    uitests.vscode.quick_open.select_command(context, "Python: Select Interpreter")
    uitests.vscode.quick_input.select_value(context, name)


@behave.when("I select the default mac Interpreter")
def select_interpreter(context):
    uitests.vscode.quick_open.select_command(context, "Python: Select Interpreter")
    uitests.vscode.quick_input.select_value(context, "/usr/bin/python")


@behave.then(
    'the contents of the file "{name}" does not contain the current python interpreter'
)
def file_not_contains_interpreter(context, name):
    with open(os.path.join(context.options.workspace_folder, name), "r") as file:
        contents = file.read()
        assert context.options.python_path not in contents


@behave.then(
    'the contents of the file "{name}" contains the current python interpreter'
)
def file_contains_interpreter(context, name):
    with open(os.path.join(context.options.workspace_folder, name), "r") as file:
        contents = file.read()
        assert context.options.python_path in contents
