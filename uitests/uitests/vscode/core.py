# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.


import time

from selenium.common import exceptions


def _try_and_find(
    fn,
    timeout_messge="Timeout",
    retry_count=100,
    retry_interval=100,
    timeout=None,
    **kwargs,
):
    """Try and find a DOM element in VSC based on a predicate within a given time period."""
    if timeout is not None:
        retry_count = (timeout * 1000) / retry_interval
    else:
        timeout = retry_count * retry_interval / 1000

    trial_counter = 1
    start = time.time()
    while trial_counter < retry_count:
        if time.time() - start > timeout:
            trial_counter = retry_count + 1
        try:
            return fn.__call__()
        except (
            exceptions.NoSuchElementException,
            exceptions.StaleElementReferenceException,
        ):
            trial_counter += 1
            time.sleep(retry_interval / 1000)
    else:
        msg = f"Timeout: {timeout_messge} after {(retry_count * retry_interval) / 1000} seconds."
        raise TimeoutError(msg)


def dispatch_keys(driver, keys, element=None):
    """Sends key stokes to a DOM element."""
    element = driver.switch_to.active_element if element is None else element
    element.send_keys(keys)


def wait_for_element(driver, css_selector, predicate=lambda ele: True, **kwargs):
    """Wait till a DOM element in VSC is found."""

    def find():

        element = driver.find_element_by_css_selector(css_selector)
        if not element.is_displayed():
            raise exceptions.NoSuchElementException(
                "Element not yet visible, so lets wait again"
            )
        if element is None:
            raise exceptions.NoSuchElementException(
                "Predicate returned False in wait_for_element"
            )
        return element

    return _try_and_find(find, **kwargs)


def wait_for_elements(driver, css_selector, predicate=lambda elements: [], **kwargs):
    """Wait till DOM elements in VSC is found."""

    def find():
        elements = driver.find_elements_by_css_selector(css_selector)
        filtered = predicate(elements)
        if filtered:
            # Ensure all items returned are visible.
            for element in filtered:
                if not element.is_displayed():
                    raise exceptions.NoSuchElementException(
                        "Element not yet visible, so lets wait again"
                    )

            return filtered
        raise exceptions.NoSuchElementException(
            "Predicate returned False in wait_for_elements"
        )

    return _try_and_find(find, **kwargs)


def wait_for_active_element(driver, css_selector, **kwargs):
    def is_active():
        element = driver.find_element_by_css_selector(css_selector)
        assert element == driver.switch_to.active_element
        if not element.is_displayed():
            raise exceptions.NoSuchElementException(
                "Element not yet visible, so lets wait again"
            )

    return _try_and_find(is_active, **kwargs)
