from flask import current_app

import datetime as dt
import jwt

from src.auth import basic_auth
from src.api import api_bp
from src.constants import ACCESS


@api_bp.route("/tokens", methods=["POST"])
@basic_auth.login_required
def issue_token():
    expiration_timestamp_for_token = dt.datetime.utcnow() + dt.timedelta(
        minutes=current_app.config["MINUTES_FOR_TOKEN_VALIDITY"]
    )
    token_payload = {
        "exp": expiration_timestamp_for_token,
        "purpose": ACCESS,
        "user_id": basic_auth.current_user().id,
    }
    token = jwt.encode(
        token_payload,
        current_app.config["SECRET_APP"],
        algorith="HS256",
    )
    return {"token": token}
