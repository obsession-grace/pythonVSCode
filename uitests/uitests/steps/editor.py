# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import os.path

import behave
import time

import uitests.vscode.documents


@behave.given('a file named "{name}" is created with the following contents')
def given_file_create(context, name):
    with open(os.path.join(context.options.workspace_folder, name), "w") as file:
        file.write(context.text)


@behave.given('a file named "{name}" does not exist')
def given_file_no_exist(context, name):
    try:
        os.unlink(os.path.join(context.options.workspace_folder, name))
    except Exception:
        pass


@behave.then('a file named "{name}" is created')
def then_file_exists(context, name):
    start_time = time.time()
    while (time.time() - start_time) < 5:
        try:
            assert os.path.exists(os.path.join(context.options.workspace_folder, name))
        except Exception:
            time.sleep(0.1)
            pass
    assert os.path.exists(os.path.join(context.options.workspace_folder, name))


@behave.given('the file "{name}" is open')
def given_file_opened(context, name):
    uitests.vscode.documents.open_file(context, name)


@behave.when("I go to line {line_number:Number}")
def when_go_to_line(context, line_number):
    uitests.vscode.documents.go_to_line(context, line_number)


@behave.then('the file "{name}" contains the value "{value}"')
def file_contains(context, name, value):
    start_time = time.time()
    file_name = os.path.join(context.options.workspace_folder, name)
    while (time.time() - start_time) < 5:
        try:
            with open(file_name, "r") as file:
                contents = file.read()
                assert value not in contents
        except AssertionError:
            time.sleep(0.1)
            pass
    assert value not in contents


@behave.when('I open the file "{name}"')
def when_file_opened(context, name):
    uitests.vscode.documents.open_file(context, name)


@behave.then('open the file "{name}"')
def then_open_file(context, name):
    uitests.vscode.documents.open_file(context, name)
