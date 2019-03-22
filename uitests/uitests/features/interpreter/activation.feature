Feature: Terminal Activation

    Scenario: Environment is not actiavted in the Terminal
        Given a file named "run_in_terminal.py" is created with the following contents
            """
            import sys

            open("log.log", "w").write(sys.executable)
            """
        And a file named "log.log" does not exist
        And the workspace setting "python.terminal.activateEnvironment" is disabled
        And a terminal is opened
        When I send the command "python run_in_terminal.py" to the terminal
        Then a file named "log.log" is created
        And open the file "log.log"
        And the contents of the file "log.log" does not contain the current python interpreter

    Scenario: Environment is actiavted in the Terminal
        Given a file named "run_in_terminal.py" is created with the following contents
            """
            import sys

            open("log.log", "w").write(sys.executable)
            """
        And a file named "log.log" does not exist
        And the workspace setting "python.terminal.activateEnvironment" is enabled
        And a terminal is opened
        When I send the command "python run_in_terminal.py" to the terminal
        Then a file named "log.log" is created
        And open the file "log.log"
        And the contents of the file "log.log" contains the current python interpreter
