# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import json
import os
import pathlib

from . import setup


def update_workspace_settings(context, settings={}):
    workspace_folder = context.options.workspace_folder
    settings_json = os.path.join(workspace_folder, ".vscode", "settings.json")
    setup.update_settings(settings_json, settings)


def remove_workspace_setting(context, setting):
    workspace_folder = context.options.workspace_folder
    settings_json = os.path.join(workspace_folder, ".vscode", "settings.json")
    setup.remove_setting(settings_json, setting)


def _ensure_setttings_json(settings_json):
    os.makedirs(pathlib.Path(settings_json).parent, exist_ok=True)
    if os.path.exists(settings_json):
        return
    with open(settings_json, "w") as file:
        file.write("{}")


def update_settings(settings_json, settings={}):
    _ensure_setttings_json(settings_json)
    existing_settings = {}
    with open(settings_json, "r") as file:
        existing_settings = json.loads(file.read())

    with open(settings_json, "w") as file:
        existing_settings.update(settings)
        json.dump(existing_settings, file, indent=4)


def remove_setting(settings_json, setting):
    _ensure_setttings_json(settings_json)
    existing_settings = {}
    with open(settings_json, "r") as file:
        existing_settings = json.loads(file.read())

    if setting not in existing_settings:
        return
    del existing_settings[setting]

    with open(settings_json, "w") as file:
        json.dump(existing_settings, file, indent=4)


def get_setting(settings_json, setting):
    _ensure_setttings_json(settings_json)
    existing_settings = {}
    with open(settings_json, "r") as file:
        existing_settings = json.loads(file.read())

    return getattr(existing_settings, setting, None)
