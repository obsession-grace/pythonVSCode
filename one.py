from selenium import webdriver


options = webdriver.ChromeOptions()
options.binary_location = "/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode/.vscode-test/stable/Visual Studio Code.app/Contents/MacOS/Electron"
# options.add_argument('--headless')
# options.add_argument("--disable-dev-shm-usage")
# # options.add_argument("start-maximized")
# # options.add_argument("disable-infobars")
# options.add_argument("--disable-extensions")
# options.add_argument("--disable-gpu")
# options.add_argument("--no-sandbox")
# options.add_argument('--disable-setuid-sandbox')
# options.add_argument('--headless')
# options.add_argument('--no-sandbox')
args = [ '/Users/donjayamanne/Desktop/Development/PythonStuff/smoke tests/workspace folder0',
  '--extensions-dir=/Users/donjayamanne/.vscode-insiders/xx',
  '--extensionDevelopmentPath=/Users/donjayamanne/.vscode-insiders/extensions/pythonVSCode',
  '--user-data-dir=/Users/donjayamanne/Desktop/Development/PythonStuff/smoke tests/testData/d0',
  '--driver',
  '/var/folders/22/0kj01mp12l3dsd1vw9vhfs6c0000gn/T/tmp-21345jx8dtUpCgndF' ]

# for arg in args:
#     options.add_argument(arg)
# options.add_argument('--disable-dev-shm-usage')
# options.add_argument('--headless')
# options.add_argument('--no-sandbox')
# options.add_argument('--disable-dev-shm-usage')
driver = webdriver.Chrome(chrome_options=options)

print("Started")

import time
time.sleep(5)
print("Started")

print("Started")
# driver.get("http://www.google.com")


try:
    ele = driver.find_element_by_css_selector(".composite-bar .monaco-action-bar.vertical .actions-container")
    print(ele)
    print(ele.get_attribute('role'))
    print("yay")
except:
    print("yikes")
    import traceback
    traceback.print_exc()
print("nope")
# print(ele)

driver.quit()
