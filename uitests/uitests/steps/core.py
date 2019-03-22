# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import logging
import time

import behave

import uitests.vscode.application


@behave.when("I wait for {seconds:n} seconds")
def when_sleep(context, seconds):
    time.sleep(seconds)


@behave.then("wait for {seconds:n} seconds")
def then_sleep(context, seconds):
    time.sleep(seconds)


@behave.then('log the message "{message}"')
def log_message(context, message):
    logging.info(message)


@behave.then("take a screenshot")
def capture_screen(context):
    uitests.vscode.application.capture_screen(context)
