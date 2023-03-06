import json
import unittest

from src import db, create_app


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


class TestBasePlusUtilities(TestBase):
    def util_create_user(self, username, email, password):
        data = {
            "username": username,
            "email": email,
            "password": password,
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

    def util_confirm_user(self, user_id):
        account_confirmation_token = (
            self.app.token_serializer_for_password_resets.dumps(
                {"user_id": user_id}
            ).decode("utf-8")
        )

        self.client.post(
            f"/api/confirm-newly-created-account/{account_confirmation_token}"
        )
