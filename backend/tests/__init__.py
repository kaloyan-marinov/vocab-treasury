import dataclasses
import json
import unittest

from src import db, create_app
from src.constants import ACCOUNT_CONFIRMATION


class TestBase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(name_of_configuration="testing")

        self.app_context = self.app.app_context()
        self.app_context.push()

        db.drop_all()  # just in case
        db.create_all()

        self.client = self.app.test_client()

    def tearDown(self):
        db.drop_all()

        self.app_context.pop()


@dataclasses.dataclass(frozen=True)
class UserResource:
    id: int
    username: str
    email: str
    password: str
    is_confirmed: bool = False
    token: str = ""


class TestBasePlusUtilities(TestBase):
    def util_create_user(
        self,
        username,
        email,
        password,
        should_confirm_new_user=False,
    ) -> UserResource:
        data = {
            "username": username,
            "email": email,
            "password": password,
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={
                "Content-Type": "application/json",
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        user_id = body["id"]

        if should_confirm_new_user:
            self.util_confirm_user(user_id)

        return UserResource(
            user_id,
            username,
            email,
            password,
            is_confirmed=should_confirm_new_user,
        )

    def util_confirm_user(self, user_id):
        token_payload = {
            "purpose": ACCOUNT_CONFIRMATION,
            "user_id": user_id,
        }
        account_confirmation_token = (
            self.app.token_serializer_for_account_confirmation.dumps(
                token_payload
            ).decode("utf-8")
        )

        self.client.post(
            f"/api/confirm-newly-created-account/{account_confirmation_token}"
        )
