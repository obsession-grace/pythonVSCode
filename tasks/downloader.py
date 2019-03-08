import os
import os.path
import re
import requests
import shutil
import sys
import tempfile
from enum import Enum
from progress.bar import Bar
from progress.spinner import Spinner
from subprocess import run, PIPE


class Platform(Enum):
    OSX = 4
    Windows = 2
    Linux = 3


def get_platform() -> Platform:
    platforms = {
        "linux1": Platform.Linux,
        "linux2": Platform.Linux,
        "darwin": Platform.OSX,
        "win32": Platform.Windows,
    }
    if sys.platform not in platforms:
        return sys.platform

    return platforms[sys.platform]


def get_download_platform() -> str:
    platform_type = get_platform()
    if platform_type == Platform.Linux:
        return "linux-x64"
    if platform_type == Platform.OSX:
        return "darwin"
    if platform_type == Platform.Windows:
        return "win32-archive"


def get_latest_version(channel: str = "stable") -> str:
    """
    Gets the latest version of VS Code
        :param channel:str='stable': stable/insider channel.
                                     Defaults to stable.
    """
    download_platform = get_download_platform()
    url = f"https://update.code.visualstudio.com/api/releases/{channel}/{download_platform}"  # noqa
    versions = requests.get(url)
    return versions.json()[0]


def get_download_url(
    version: str, download_platform: str, channel: str = "stable"
) -> str:
    """
    Gets the download url for vs ccode.
        :param version:str:
        :param download_platform:str:
        :param channel:str="stable": stable/insider
    """
    return f"https://vscode-update.azurewebsites.net/{version}/{download_platform}/{channel}"  # noqa


def run_command(command, cwd=None, silent=False, progress_message=None):
    """Run the specified command in a subprocess shell."""
    executable = shutil.which(command[0])
    command[0] = executable
    stdout = PIPE if silent else None
    cmd = run(command, cwd=cwd, stdout=stdout, shell=False)
    cmd.check_returncode()
    # if progress_message:
    #     progress = Spinner(progress_message)
    # while True:
    #     try:
    #         exit_code = proc.wait(1)
    #     except Exception:
    #         if progress:
    #             progress.next()
    #         continue

    #     print(exit_code)
    #     if exit_code == 0:
    #         return
    #     if exit_code is not None:
    #         raise SystemError(
    #             "Command exited with a non-zero exit code," + command
    #         )  # noqa


def get_electron_version(channel: str = "stable"):
    if channel == "stable":
        version = get_latest_version()
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
    electron_version = get_electron_version(channel)
    js_file = os.path.join(os.getcwd(), "wow", "chrome_downloader.js")
    run_command(
        ["node", js_file, electron_version, download_path],
        progress_message="Downloading chrome driver",
    )


def unzip_file(zip_file: str, destination: str):
    run_command(
        ["unzip", zip_file, "-d", destination],
        silent=True,
        progress_message="Extracting zip file",
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

    download_platform = get_download_platform()
    version = get_latest_version(channel)
    url = get_download_url(version, download_platform, channel)

    progress = Bar(f"Downloading VS Code {channel}", max=100)
    response = requests.get(url, stream=True)
    total = response.headers.get("content-length")
    zip_file = os.path.join(tempfile.mkdtemp(), "vscode.zip")

    with open(zip_file, "wb") as fs:
        if total is None:
            fs.write(response.content)
        else:
            downloaded = 0
            total = int(total)
            chunk_size = 1024 * 1024
            percent = 0
            for data in response.iter_content(chunk_size=chunk_size):
                downloaded += len(data)
                fs.write(data)
                change_in_percent = int(downloaded * 100 / total) - percent
                percent = int(downloaded * 100 / total)
                for i in range(change_in_percent):
                    progress.next()
    progress.finish()

    unzip_file(zip_file, download_path)
    download_chrome_driver(download_path)


# print(get_electron_version())
# download_chrome_driver()
# download(os.getcwd() + "/vsc")
