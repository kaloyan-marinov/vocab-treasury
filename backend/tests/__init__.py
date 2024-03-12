import dataclasses
import json
import unittest
import datetime as dt
import jwt

from src import db, create_app
from src.constants import EMAIL_ADDRESS_CONFIRMATION


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
        should_confirm_email_address=False,
    ) -> UserResource:
        data_dict = {
            "username": username,
            "email": email,
            "password": password,
        }
        rv = self.client.post(
            "/api/users",
            json=data_dict,
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        user_id = body["id"]

        if should_confirm_email_address:
            self.util_confirm_email_address(user_id)

        return UserResource(
            user_id,
            username,
            email,
            password,
            is_confirmed=should_confirm_email_address,
        )

    def util_confirm_email_address(self, user_id):
        expiration_timestamp_for_token = dt.datetime.utcnow() + dt.timedelta(
            days=self.app.config["DAYS_FOR_EMAIL_ADDRESS_CONFIRMATION"]
        )
        token_payload = {
            "exp": expiration_timestamp_for_token,
            "purpose": EMAIL_ADDRESS_CONFIRMATION,
            "user_id": user_id,
        }
        email_address_confirmation_token = jwt.encode(
            token_payload,
            key=self.app.config["SECRET_KEY"],
            algorithm="HS256",
        )

        self.client.post(
            f"/api/confirm-email-address/{email_address_confirmation_token}"
        )
