# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import os
import json

data = {item:value for item, value in os.environ.items()}
print(json.dumps(data))
