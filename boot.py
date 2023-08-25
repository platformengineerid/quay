#!/usr/bin/env python

import logging
import os.path
from datetime import datetime, timedelta
from urllib.parse import urlunparse

from cachetools.func import lru_cache
from cryptography.hazmat.primitives import serialization
from jinja2 import Template

import release
from _init import CONF_DIR
from app import app
from data.model import ServiceKeyDoesNotExist
from data.model.release import set_region_release
from data.model.service_keys import get_service_key
from util.config.database import sync_database_with_config
from util.generatepresharedkey import generate_key

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_audience():
    scheme = app.config.get("PREFERRED_URL_SCHEME")
    hostname = app.config.get("SERVER_HOSTNAME")

    # hostname includes port, use that
    if ":" in hostname:
        return urlunparse((scheme, hostname, "", "", "", ""))

    # no port, guess based on scheme
    if scheme == "https":
        port = "443"
    else:
        port = "80"

    return urlunparse((scheme, hostname + ":" + port, "", "", "", ""))


def _verify_service_key():
    try:
        with open(app.config["INSTANCE_SERVICE_KEY_KID_LOCATION"]) as f:
            quay_key_id = f.read()

        try:
            get_service_key(quay_key_id, approved_only=False)
            assert os.path.exists(app.config["INSTANCE_SERVICE_KEY_LOCATION"])
            return quay_key_id
        except ServiceKeyDoesNotExist:
            logger.exception(
                "Could not find non-expired existing service key %s; creating a new one",
                quay_key_id,
            )
            return None

        # Found a valid service key, so exiting.
    except IOError:
        logger.exception("Could not load existing service key; creating a new one")
        return None


def setup_instance_service_key():
    """
    Creates a service key for quay.
    """
    # Ensure we have an existing key if in read-only mode.
    if app.config.get("REGISTRY_STATE", "normal") == "readonly":
        quay_key_id = _verify_service_key()
        if quay_key_id is None:
            raise Exception("No valid service key found for read-only registry.")
    else:
        # Generate the key for this Quay instance to use.
        minutes_until_expiration = app.config.get("INSTANCE_SERVICE_KEY_EXPIRATION", 120)
        expiration = datetime.utcnow() + timedelta(minutes=minutes_until_expiration)
        quay_key, quay_key_id = generate_key(
            app.config["INSTANCE_SERVICE_KEY_SERVICE"], get_audience(), expiration_date=expiration
        )

        with open(app.config["INSTANCE_SERVICE_KEY_KID_LOCATION"], mode="w") as f:
            f.truncate(0)
            f.write(quay_key_id)

        with open(app.config["INSTANCE_SERVICE_KEY_LOCATION"], mode="wb") as f:
            f.truncate(0)
            f.write(
                quay_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.TraditionalOpenSSL,
                    encryption_algorithm=serialization.NoEncryption(),
                )
            )


def main():
    if not app.config.get("SETUP_COMPLETE", False):
        raise Exception(
            "Your configuration bundle is either not mounted or setup has not been completed"
        )

    sync_database_with_config(app.config)
    setup_instance_service_key()

    # Record deploy
    if release.REGION and release.GIT_HEAD:
        set_region_release(release.SERVICE, release.REGION, release.GIT_HEAD)


if __name__ == "__main__":
    main()
