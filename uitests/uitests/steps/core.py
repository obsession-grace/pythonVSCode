# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import logging
import time

import behave

import uitests.vscode.application
import uitests.vscode.quick_open
import uitests.vscode.startup


@behave.when("I wait for {seconds:n} seconds")
def when_sleep(context, seconds):
    time.sleep(seconds)


@behave.when("I reload VSC")
def when_reload(context):
    uitests.vscode.application.exit(context)
    app_context = uitests.vscode.startup.start(context.options)
    context.driver = app_context.driver
    uitests.vscode.startup.clear_everything(app_context)


@behave.then("wait for {seconds:n} seconds")
def then_sleep(context, seconds):
    time.sleep(seconds)


@behave.then('log the message "{message}"')
def log_message(context, message):
    logging.info(message)


@behave.then("take a screenshot")
def capture_screen(context):
    uitests.vscode.application.capture_screen(context)
