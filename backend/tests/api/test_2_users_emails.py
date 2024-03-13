import json
from unittest.mock import patch
import base64
import datetime as dt
import jwt

from flask_sqlalchemy import BaseQuery

from src import flsk_bcrpt, User, EmailAddressChange
from tests import TestBasePlusUtilities, UserResource
from src.constants import EMAIL_ADDRESS_CONFIRMATION


class Test_01_EditUsersEmails(TestBasePlusUtilities):
    def _issue_valid_email_address_confirmation_token(
        self, user_id, email_address_change_id=None
    ):
        expiration_timestamp_for_token = dt.datetime.utcnow() + dt.timedelta(
            days=self.app.config["DAYS_FOR_EMAIL_ADDRESS_CONFIRMATION"]
        )
        token_payload = {
            "exp": expiration_timestamp_for_token,
            "purpose": EMAIL_ADDRESS_CONFIRMATION,
            "user_id": user_id,
        }
        if email_address_change_id is not None:
            token_payload["email_address_change_id"] = email_address_change_id
        valid_token_correct_purpose = jwt.encode(
            token_payload,
            key=self.app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        return valid_token_correct_purpose

    def test_01_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to edit a confirmed User resource in such a way
        that it would end up having the same email as another User resource
        - regardless of whether the latter User resource is confirmed or not.
        """

        # Arrange.
        # Create two User resources, but confirm only the first one.
        data_0_1 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_0_2 = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }

        __ = self.util_create_user(
            data_0_1["username"],
            data_0_1["email"],
            data_0_1["password"],
            should_confirm_email_address=True,
        )
        __ = self.util_create_user(
            data_0_2["username"],
            data_0_2["email"],
            data_0_2["password"],
        )

        # Act.
        # Attempt to edit the 1st User resource in such a way that
        # its email should end up being identical to the 2nd User resource's email.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        data_dict = {
            "email": "mary.smith@protonmail.com",
        }

        rv = self.client.put(
            "/api/users/1",
            json=data_dict,
            headers={
                "Authorization": authorization,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same email as the"
                    " one you provided."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        targeted_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(targeted_u, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(targeted_u.password_hash, "123"),
        )

    def test_02_prevent_unconfirmed_user_from_initiating_email_edit(self):
        """
        Ensure that, if a `User`
            (a) provides valid authentication,
            (b) attempts to edit his/her email address, but
            (c) has not confirmed his/her email address,
        then the response should be a 400.
        """

        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"
        u_r: UserResource = self.util_create_user(username, email, password)

        data_dict = {
            "email": "john.doe.2@protonmail.com",
        }

        # Act.
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            f"/api/users/{u_r.id}",
            json=data_dict,
            headers={
                "Authorization": authorization,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "Your email address has not been confirmed."
                    " Please confirm your email address"
                    " and re-issue the same HTTP request."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that no `EmailAddressChange` object has been created.
        num_of_email_address_changes = EmailAddressChange.query.filter_by(
            user_id=u_r.id,
        ).count()
        self.assertEqual(num_of_email_address_changes, 0)

    def test_03_edit_email_of_authenticated_user(self):
        """
        Ensure that the user,
        who has been confirmed and is authenticated by the issued request's header,
        is able to edit the email address
        associated with his/her corresponding `User` resource.
        """

        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        u_r: UserResource = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        # Act.
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        data_dict = {
            "email": "JOHN.DOE@PROTONMAIL.COM",
        }

        rv = self.client.put(
            f"/api/users/{u_r.id}",
            json=data_dict,
            headers={
                "Authorization": authorization,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 202)
        self.assertEqual(
            body,
            {
                "message": (
                    "Please check the inbox of your new email address for instructions"
                    " on how to confirm that address..."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited yet.
        user = User.query.get(u_r.id)
        self.assertEqual(user.email, u_r.email)

        # Act.
        valid_token_correct_purpose = (
            self._issue_valid_email_address_confirmation_token(
                u_r.id,
                email_address_change_id=1,
            )
        )

        rv = self.client.post(
            f"/api/confirm-email-address/{valid_token_correct_purpose}"
        )

        # Assert.
        self.assertEqual(rv.status_code, 200)

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, got edited successfully.
        user = User.query.get(u_r.id)
        self.assertEqual(user.email, data_dict["email"])

    def test_04_consecutive_email_edits(self):
        """
        Ensure that, if a confirmed user
            (1) requests an email change,
            (2) does not follow the instructions in the message from (1),
            (3) requests another email change,
            (4) follows the instructions in the message from (1),
        then their email address on record will not get edited
        in the application's persistence layer.
        """

        # Arrange.
        #   (1) create a user + prepare for initiating 2 email-address changes
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        u_r: UserResource = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        data_dict_1 = {
            "email": "john.doe.1@protonmail.com",
        }
        data_dict_2 = {
            "email": "john.doe.2@protonmail.com",
        }

        #   (2) initiate 2 email-address changes
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Bearer " + b_a_c

        token_1 = self._issue_valid_email_address_confirmation_token(
            u_r.id, email_address_change_id=1
        )
        with patch("src.auth.jwt.encode") as mock_4_jwt_encode:
            mock_4_jwt_encode.side_effect = token_1

            rv_1 = self.client.put(
                f"/api/users/{u_r.id}",
                json=data_dict_1,
                headers={
                    "Authorization": authorization,
                },
            )
            self.assertEqual(rv_1.status_code, 202)

        rv_2 = self.client.put(
            f"/api/users/{u_r.id}",
            json=data_dict_2,
            headers={
                "Authorization": authorization,
            },
        )
        self.assertEqual(rv_2.status_code, 202)

        # Act.
        rv = self.client.post(f"/api/confirm-email-address/{token_1}")

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": (
                    "You have initiated a request,"
                    " or several consecutive such requests,"
                    " for editing the email address associated with your account;"
                    " you may only follow up on the instructions"
                    " that you received for the most recently initiated request."
                ),
            },
        )

        user = User.query.get(u_r.id)
        self.assertEqual(user.email, u_r.email)

    def test_05_consecutive_email_edits(self):
        """
        Ensure that, if a confirmed user
            (1) requests an email change,
            (2) does not follow the instructions in the message from (1),
            (3) requests another email change,
            (4) follows the instructions in the message from (2),
        then, in the application's persistence layer,
        the email address on record (for the user in question) will get edited
        but no trace of (1) will remain.
        """

        # Arrange.
        #   (1) create a user + prepare for initiating 2 email-address changes
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        u_r: UserResource = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        data_dict_1 = {
            "email": "john.doe.1@protonmail.com",
        }
        data_dict_2 = {
            "email": "john.doe.2@protonmail.com",
        }

        #   (2) initiate 2 email-address changes
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Bearer " + b_a_c

        rv_1 = self.client.put(
            f"/api/users/{u_r.id}",
            json=data_dict_1,
            headers={
                "Authorization": authorization,
            },
        )
        self.assertEqual(rv_1.status_code, 202)

        token_2 = self._issue_valid_email_address_confirmation_token(
            u_r.id, email_address_change_id=2
        )
        with patch("src.auth.jwt.encode") as mock_4_jwt_encode:
            mock_4_jwt_encode.return_value = token_2

            rv_2 = self.client.put(
                f"/api/users/{u_r.id}",
                json=data_dict_2,
                headers={
                    "Authorization": authorization,
                },
            )
            self.assertEqual(rv_2.status_code, 202)

        # Act.
        rv = self.client.post(f"/api/confirm-email-address/{token_2}")

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "message": (
                    "You have confirmed your email address successfully."
                    " You may now log in."
                )
            },
        )

        user = User.query.get(u_r.id)
        self.assertEqual(user.email, data_dict_2["email"])

        email_address_changes: BaseQuery = EmailAddressChange.query.filter_by(
            user_id=u_r.id
        )

        num_of_email_address_changes = email_address_changes.count()
        self.assertEqual(num_of_email_address_changes, 1)

        e_a_c = email_address_changes.first()
        self.assertEqual(e_a_c.id, 2)
        self.assertEqual(e_a_c.new, data_dict_2["email"])
