class VSCode(object):
    def __init__(self, driver: webdriver.Chrome):
        self.driver = driver

    @classmethod
    def start(cls: VSCode, options: Options):
        _setup_environment(options)
        driver = launch_extension(options)
        return cls1(driver)
