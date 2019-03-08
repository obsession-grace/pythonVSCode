import os
import os.path
import re
import requests
import shutil
import sys
import tempfile
from enum import Enum
from ..utils.tools import run_command, download_file, unzip_file, ensure_directory


class Platform(Enum):
    OSX = 4
    Windows = 2
    Linux = 3


def _get_platform() -> Platform:
    platforms = {
        "linux1": Platform.Linux,
        "linux2": Platform.Linux,
        "darwin": Platform.OSX,
        "win32": Platform.Windows,
    }
    if sys.platform not in platforms:
        return sys.platform

    return platforms[sys.platform]


def _get_download_platform() -> str:
    platform_type = _get_platform()
    if platform_type == Platform.Linux:
        return "linux-x64"
    if platform_type == Platform.OSX:
        return "darwin"
    if platform_type == Platform.Windows:
        return "win32-archive"


def _get_latest_version(channel: str = "stable") -> str:
    """
    Gets the latest version of VS Code
        :param channel:str='stable': stable/insider channel.
                                     Defaults to stable.
    """
    download_platform = _get_download_platform()
    url = f"https://update.code.visualstudio.com/api/releases/{channel}/{download_platform}"  # noqa
    versions = requests.get(url)
    return versions.json()[0]


def _get_download_url(
    version: str, download_platform: str, channel: str = "stable"
) -> str:
    """
    Gets the download url for vs ccode.
        :param version:str:
        :param download_platform:str:
        :param channel:str="stable": stable/insider
    """
    return f"https://vscode-update.azurewebsites.net/{version}/{download_platform}/{channel}"  # noqa


def _get_electron_version(channel: str = "stable"):
    if channel == "stable":
        version = _get_latest_version()
        # Assume that VSC tags based on major and minor numbers.
        # E.g. 1.32 and not 1.32.1
        version_parts = version.split(".")
        tag = f"{version_parts[0]}.{version_parts[1]}"
        url = (
            f"https://raw.githubusercontent.com/Microsoft/vscode/release/{tag}/.yarnrc" # noqa
        )
    else:
        url = "https://raw.githubusercontent.com/Microsoft/vscode/master/.yarnrc" # noqa

    response = requests.get(url)
    regex = r"target\s\"(\d+.\d+.\d+)\""
    matches = re.finditer(regex, response.text, re.MULTILINE)
    for _, match in enumerate(matches, start=1):
        return match.groups()[0]


def download_chrome_driver(download_path: str, channel: str = "stable"):
    """
    Download chrome driver corresponding to the version of electron.
    Basically check version of chrome released with the version of Electron.
    The npm scrtip makes it easier.
        :param download_path:str:
    """
    download_path = os.path.abspath(download_path)
    ensure_directory(download_path)
    electron_version = _get_electron_version(channel)
    js_file = os.path.join(os.getcwd(), "wow", "chrome_downloader.js")
    run_command(
        ["node", js_file, electron_version, download_path],
        progress_message="Downloading chrome driver",
    )


def download_vscode(download_path: str, channel: str = "stable"):
    """
    Downloads VS Code along with the chrome driver.
        :param download_path:str:
        :param channel:str: Whether to download 'stable' or 'insiders'
                            Defaults to stable.
    """
    download_path = os.path.abspath(download_path)
    shutil.rmtree(download_path, ignore_errors=True)
    ensure_directory(download_path)

    download_platform = _get_download_platform()
    version = _get_latest_version(channel)
    url = _get_download_url(version, download_platform, channel)

    zip_file = os.path.join(tempfile.mkdtemp(), "vscode.zip")
    download_file(url, zip_file, f"Downloading VS Code {channel}")
    unzip_file(zip_file, download_path)
