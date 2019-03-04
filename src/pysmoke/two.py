import behave
import behave.step_registry
from behave import runner_util
from behave.runner import Runner
from behave.configuration import Configuration, ConfigError
from behave.step_registry import registry
from behave.runner_util import collect_feature_locations, parse_features

config = Configuration(None)
runner = Runner(config)
runner.setup_paths()
runner.load_step_definitions()

feature_locations = [filename for filename in runner.feature_locations()
                        if not runner.config.exclude(filename)]
features = parse_features(feature_locations, language=runner.config.lang)
runner.features.extend(features)

print(behave.step_registry.registry.steps)
