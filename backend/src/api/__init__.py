from flask import Blueprint


api_bp = Blueprint("api_blueprint", __name__)


# fmt: off
'''
Q: Why is the following statement necessary?

A: Without it,
   starting a process responsible for serving the application
   (or running the test suite)
   would register the `api_bp` blueprint with the application instance,
   but that blueprint will not be associated with any request-handling functions at all!
'''
from src.api import users, tokens, examples  # noqa
