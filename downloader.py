# import os
# import os.path
# import re
# import requests
# import shutil
# import subprocess
# import sys
# import tempfile
# from enum import Enum


# class Platform(Enum):
#     OSX = 4
#     Windows = 2
#     Linux = 3


# def get_platform() -> Platform:
#     platforms = {
#         "linux1": Platform.Linux,
#         "linux2": Platform.Linux,
#         "darwin": Platform.OSX,
#         "win32": Platform.Windows,
#     }
#     if sys.platform not in platforms:
#         return sys.platform

#     return platforms[sys.platform]


# def get_download_platform() -> str:
#     platform_type = get_platform()
#     if platform_type == Platform.Linux:
#         return "linux-x64"
#     if platform_type == Platform.OSX:
#         return "darwin"
#     if platform_type == Platform.Windows:
#         return "win32-archive"


# def get_latest_version() -> str:
#     download_platform = get_download_platform()
#     url = (
#         f"https://update.code.visualstudio.com/api/releases/stable/{download_platform}"
#     )
#     versions = requests.get(url)
#     return versions.json()[0]


# def get_download_url(version: str, download_platform: str) -> str:
#     return (
#         f"https://vscode-update.azurewebsites.net/{version}/{download_platform}/stable"
#     )


# def run_command(command, cwd=None, silent=False):
#     """Run the specified command in a subprocess shell."""
#     executable = shutil.which(command[0])
#     command[0] = executable
#     stdout = subprocess.PIPE if silent else None
#     cmd = subprocess.run(command, cwd=cwd, stdout=stdout, shell=False)
#     cmd.check_returncode()


# def get_electron_version():
#     version = get_latest_version()
#     # Assume that VSC tags based on major and minor numbers.
#     # E.g. 1.32 and not 1.32.1
#     version_parts = version.split(".")
#     tag = f"{version_parts[0]}.{version_parts[1]}"
#     url = f"https://raw.githubusercontent.com/Microsoft/vscode/release/{tag}/.yarnrc"

#     r = requests.get(url)
#     regex = r"target\s\"(\d+.\d+.\d+)\""
#     matches = re.finditer(regex, r.text, re.MULTILINE)
#     for _, match in enumerate(matches, start=1):
#         return match.groups()[0]


# def download_chrome_driver(download_path: str):
#     """
#     Download chrome driver corresponding to the version of electron.
#     Basically check version of chrome released with the version of Electron.
#     The npm scrtip makes it easier.
#         :param download_path:str:
#     """
#     electron_version = get_electron_version()
#     js_file = os.path.join(os.getcwd(), "wow", "chrome_downloader.js")
#     run_command(["node", js_file, electron_version, download_path])


# def download(download_path: str):
#     download_platform = get_download_platform()
#     version = get_latest_version()
#     url = get_download_url(version, download_platform)

#     r = requests.get(url)
#     zip_file = os.path.join(tempfile.mkdtemp(), "something")
#     zip_file = "one.zip"
#     with open(zip_file, "wb") as fs:
#         fs.write(r.content)

#     run_command(["unzip", zip_file, "-d", download_path], silent=True)

#     download_chrome_driver(download_path)


# # print(get_electron_version())
# # download_chrome_driver()
# download(os.getcwd() + "/vsc")
