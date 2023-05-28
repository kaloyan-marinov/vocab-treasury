import json
from unittest.mock import patch
import base64

from flask_sqlalchemy import BaseQuery

from src import flsk_bcrpt, User, EmailAddressChange
from tests import TestBasePlusUtilities, UserResource
from src.constants import EMAIL_ADDRESS_CONFIRMATION


class Test_01_EditUsersEmails(TestBasePlusUtilities):
    def _issue_valid_email_address_confirmation_token(
        self, user_id, email_address_change_id=None
    ):
        token_payload = {
            "purpose": EMAIL_ADDRESS_CONFIRMATION,
            "user_id": user_id,
        }
        if email_address_change_id is not None:
            token_payload["email_address_change_id"] = email_address_change_id
        valid_token_correct_purpose = (
            self.app.token_serializer_for_email_address_confirmation.dumps(
                token_payload
            ).decode("utf-8")
        )
        return valid_token_correct_purpose

    def test_01_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to edit a confirmed User resource in such a way
        that it would end up having the same email as another User resource
        - regardless of whether the latter User resource is confirmed or not.
        """

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

        # Attempt to edit the 1st User resource in such a way that
        # its email should end up being identical to the 2nd User resource's email.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        data = {"email": "mary.smith@protonmail.com"}
        data_str = json.dumps(data)

        rv = self.client.put(
            "/api/users/1",
            data=data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

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

    def test_02_edit_email_of_authenticated_user(self):
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

        data = {
            "email": "JOHN.DOE@PROTONMAIL.COM",
        }
        data_str = json.dumps(data)

        rv = self.client.put(
            f"/api/users/{u_r.id}",
            data=data_str,
            headers={
                "Content-Type": "application/json",
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
        self.assertEqual(user.email, data["email"])

    def test_03_consecutive_email_edits(self):
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
        # TODO: (2023/05/26, 08:17)
        #
        #       (d) write a "sibling" test to `test_10_consecutive_email_edits`
        #           but provide `token_2` in the "sibling" test
        #           +
        #           enhance the handler for `POST /confirm-email-address/<token>` requests
        #           so as to purge/delete all `EmailChangeRequest`s
        #           whose `old` attributes have the same value
        #           _and_
        #           whose instruction(-set)s were not followed up on

        # Arrange. (part 1)
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        u_r: UserResource = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        data_1 = {
            "email": "john.doe.1@protonmail.com",
        }
        data_2 = {
            "email": "john.doe.2@protonmail.com",
        }

        token_2 = self._issue_valid_email_address_confirmation_token(
            u_r.id, email_address_change_id=2
        )

        # Arrange. (part 2)
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Bearer " + b_a_c

        rv_1 = self.client.put(
            f"/api/users/{u_r.id}",
            data=json.dumps(data_1),
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )
        self.assertEqual(rv_1.status_code, 202)

        rv_2 = self.client.put(
            f"/api/users/{u_r.id}",
            data=json.dumps(data_2),
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )
        self.assertEqual(rv_2.status_code, 202)

        # Act.
        rv = self.client.post(f"/api/confirm-email-address/{token_2}")

        # Assert.
        user = User.query.get(u_r.id)
        self.assertEqual(user.email, data_2["email"])

        email_address_changes: BaseQuery = EmailAddressChange.query.filter_by(
            user_id=u_r.id
        )

        num_of_email_address_changes = email_address_changes.count()
        self.assertEqual(num_of_email_address_changes, 1)

        e_a_c = email_address_changes.first()
        self.assertEqual(e_a_c.id, 2)
        self.assertEqual(e_a_c.new, data_2["email"])

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
        # TODO: (2023/05/25, 07:17)
        #       (a) consolidate "# Arrange. (part 1)" and "# Arrange. (part 2)"
        #       (b) think about simplifying the mocking that is done in this test case
        # Arrange. (part 1)
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        u_r: UserResource = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        data_1 = {
            "email": "john.doe.1@protonmail.com",
        }
        data_2 = {
            "email": "john.doe.2@protonmail.com",
        }

        token_1 = self._issue_valid_email_address_confirmation_token(
            u_r.id, email_address_change_id=1
        )
        token_2 = self._issue_valid_email_address_confirmation_token(
            u_r.id, email_address_change_id=2
        )

        # Arrange. (part 2)
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Bearer " + b_a_c

        with patch(
            "src.TimedJSONWebSignatureSerializer.dumps",
        ) as serializer_dumps_mock:
            serializer_dumps_mock.return_value = token_1.encode("utf-8")

            rv_1 = self.client.put(
                f"/api/users/{u_r.id}",
                data=json.dumps(data_1),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": authorization,
                },
            )
            self.assertEqual(rv_1.status_code, 202)

        with patch(
            "src.TimedJSONWebSignatureSerializer.dumps",
        ) as serializer_dumps_mock:
            serializer_dumps_mock.return_value = token_2.encode("utf-8")

            rv_2 = self.client.put(
                f"/api/users/{u_r.id}",
                data=json.dumps(data_2),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": authorization,
                },
            )
            self.assertEqual(rv_2.status_code, 202)

        # Act.
        rv = self.client.post(f"/api/confirm-email-address/{token_1}")

        # Assert.
        user = User.query.get(u_r.id)
        self.assertEqual(user.email, u_r.email)

        self.assertEqual(rv.status_code, 401)