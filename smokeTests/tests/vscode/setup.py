# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import json
import logging
import os
import os.path
import pathlib
import sys
import time

from selenium import webdriver

from dataclasses import dataclass

from . import application, extension, quick_open
from .. import tools


@dataclass
class Context:
    options: application.Options
    driver: webdriver.Chrome


def start(options):
    tools.empty_directory(options.workspace_folder)
    settings = {"python.pythonPath": sys.executable}
    setup_user_settings(options.user_dir, user_settings=settings)
    app_context = start_vscode(options)
    extension.activate_python_extension(app_context)
    return app_context


def start_vscode(options):
    logging.info("Starting application")
    application.setup_environment(options)
    driver = application.launch_extension(options)
    context = Context(options, driver)
    # Wait for sometime, until some messages appear.
    time.sleep(2)

    # VSC open some file
    # This is due to us not being able to control the cli args passed by the chrome driver.
    # Files get opened coz chrome driver assumes the executable is chrome,
    # however it isn't, it is VSC and those args are not recognized by VSC,
    # hence VSC assumes they are files and opens editors for those.
    # Just do 3 times, to be sure chrome driver doesn't open other files.
    quick_open.select_command(context, "View: Revert and Close Editor")
    quick_open.select_command(context, "View: Revert and Close Editor")
    quick_open.select_command(context, "View: Revert and Close Editor")
    reset_workspace(context)
    # Do this last, some popups open a few seconds after opening VSC.
    quick_open.select_command(context, "Notifications: Clear All Notifications")

    return context


def reset_workspace(context):
    quick_open.select_command(context, "View: Revert and Close Editor")
    quick_open.select_command(context, "Terminal: Kill the Active Terminal Instance")
    quick_open.select_command(context, "Debug: Remove All Breakpoints")
    quick_open.select_command(context, "View: Close All Editors")
    quick_open.select_command(context, "View: Close Panel")
    quick_open.select_command(context, "Notifications: Clear All Notifications")

    workspace_folder = context.options.workspace_folder
    if getattr(context, "workspace_repo", None) is None:
        tools.empty_directory(workspace_folder)
    else:
        logging.info(f"Resetting workspace folder")
        tools.run_command(["git", "reset", "--hard"], cwd=workspace_folder, silent=True)
        tools.run_command(["git", "clean", "-fd"], cwd=workspace_folder, silent=True)

    settings_json = os.path.join(workspace_folder, ".vscode", "settings.json")
    _ensure_setttings_json(settings_json)


def setup_workspace(source_repo, target, temp_folder):
    logging.info(f"Setting up workspace folder from {source_repo}")
    tools.empty_directory(target)
    tools.run_command(["git", "clone", source_repo, "."], cwd=target, silent=True)
    settings_json = os.path.join(target, ".vscode", "settings.json")
    _ensure_setttings_json(settings_json)


def setup_user_settings(user_folder, **kwargs):
    folder = os.path.join(user_folder, "User")
    os.makedirs(folder, exist_ok=True)
    settings_json = os.path.join(folder, "settings.json")
    _ensure_setttings_json(settings_json)
    user_settings = kwargs.get("user_settings", None)
    if user_settings is not None:
        _update_settings(settings_json, user_settings)


def _ensure_setttings_json(settings_json):
    os.makedirs(pathlib.Path(settings_json).parent, exist_ok=True)
    if os.path.exists(settings_json):
        return
    with open(settings_json, "w") as file:
        file.write("{}")


def _update_settings(settings_json, settings):
    existing_settings = {}
    if os.path.exists(settings_json):
        with open(settings_json, "r") as file:
            existing_settings = json.loads(file.read())

    with open(settings_json, "w") as file:
        existing_settings.update(settings)
        json.dump(existing_settings, file, indent=4)
