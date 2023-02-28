from flask import current_app

from src.auth import basic_auth
from src.api import api_bp


@api_bp.route("/tokens", methods=["POST"])
@basic_auth.login_required
def issue_token():
    token_payload = {"user_id": basic_auth.current_user().id}
    token = current_app.token_serializer.dumps(token_payload).decode("utf-8")
    return {"token": token}
