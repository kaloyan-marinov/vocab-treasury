import json
from unittest.mock import patch
import base64

from itsdangerous import SignatureExpired, BadSignature
from flask import url_for, current_app

from src import flsk_bcrpt, User
from tests import TestBase, TestBasePlusUtilities, UserResource
from src.constants import EMAIL_ADDRESS_CONFIRMATION, ACCESS, PASSWORD_RESET
from src.auth import validate_token


class Test_01_CreateUser(TestBase):
    """Test the request responsible for creating a new User resource."""

    def setUp(self):
        self.data_dict = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self.data_str = json.dumps(self.data_dict)
        super().setUp()

    def test_1_missing_content_type(self):
        """
        Ensure that it is impossible to create a User resource
        without providing a 'Content-Type: application/json' header.
        """

        # import sys

        # print(sys.path)

        # Attempt to create a User resource
        # without providing a 'Content-Type: application/json' header.
        rv = self.client.post("api/users", data=self.data_str)

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that no User resources have been created.
        users = User.query.all()
        self.assertEqual(len(users), 0)

    def test_2_incomplete_request_body(self):
        """
        Ensure that it is impossible to create a User resource
        without providing a value for each required field/key in the request body.
        """

        for field in ("username", "email", "password"):
            with self.subTest():
                # Attempt to create a User resource
                # without providing a value for `field` in the request body.
                data_dict = {k: v for k, v in self.data_dict.items() if k != field}
                data_str = json.dumps(data_dict)
                rv = self.client.post(
                    "/api/users",
                    data=data_str,
                    headers={"Content-Type": "application/json"},
                )

                body_str = rv.get_data(as_text=True)
                body = json.loads(body_str)
                self.assertEqual(rv.status_code, 400)
                self.assertEqual(
                    body,
                    {
                        "error": "Bad Request",
                        "message": (
                            f"Your request body did not specify a value for '{field}'"
                        ),
                    },
                )

                # (Reach directly into the application's persistence layer to)
                # Ensure that no User resources have been created.
                users = User.query.all()
                self.assertEqual(len(users), 0)

    def test_3_create_user(self):
        """
        Ensure that it is possible to create a new User resource.

        (
        This remark
        is likely obvious to experienced users of the `Flask-Mail` extension,
        but may be appreciated by those who are relatively new to using that extension.

        - while implementing the feature that
          requires every newly-created user to confirm their email address,
          I observed - empirically! - that,
          when the Python interpreter runs
          a unit test - such as the encompassing one! - that creates a User,
          no email-address-confirmation email gets sent

        - the reason for that is as follows:
          https://flask-mail.readthedocs.io/en/latest/#unit-tests-and-suppressing-emails
        )
        """

        # Create a new User resource.
        rv = self.client.post(
            "/api/users",
            data=self.data_str,
            headers={"Content-Type": "application/json"},
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 201)
        self.assertEqual(rv.headers["Location"], "http://localhost/api/users/1")
        self.assertEqual(
            body,
            {
                "id": 1,
                "username": "jd",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that a User resource has been created successfully.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = users[0]
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "is_confirmed"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "is_confirmed": 0,
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user.password_hash, "123"),
        )

        self.assertEqual(repr(user), "User(1, jd)")

    def test_4_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to create a User resource,
        which has the same email as an existing User resource.
        """

        # Create one User resource.
        rv_0 = self.client.post(
            "/api/users",
            data=self.data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to create a second User resource with the same email as the User
        # resource that was created just now.
        data = {
            "username": "different-username",
            "email": "john.doe@protonmail.com",
            "password": "different-password",
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users", data=data_str, headers={"Content-Type": "application/json"}
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
        # Ensure that the attempt has not created a second User resource.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user.password_hash, "123"),
        )

    def test_5_prevent_duplication_of_usernames(self):
        """
        Ensure that it is impossible to create a User resource,
        which has the same username as an existing User resource.
        """

        # Create one User resource.
        rv_0 = self.client.post(
            "/api/users",
            data=self.data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to create a second User resource with the same username as the User
        # resource that was created just now.
        data = {
            "username": "jd",
            "email": "different-email@protonmail.com",
            "password": "different-password",
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same username as the"
                    " one you provided."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the attempt has not created a second User resource.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user.password_hash, "123"),
        )


class Test_02_ConfirmEmailAddressOfCreatedUser(TestBasePlusUtilities):
    """
    Test the request responsible for
    confirming the email address of a newly-created `User` resource.
    """

    def setUp(self):
        self.username = "jd"
        self.email = "john.doe@protonmail.com"
        self.password = "123"
        super().setUp()

    def _issue_valid_email_address_confirmation_token(self, user_id):
        token_payload = {
            "purpose": EMAIL_ADDRESS_CONFIRMATION,
            "user_id": user_id,
        }
        valid_token_correct_purpose = (
            self.app.token_serializer_for_email_address_confirmation.dumps(
                token_payload
            ).decode("utf-8")
        )
        return valid_token_correct_purpose

    def test_1_validate_token(self):
        # Arrange.
        token = "this-value-is-immaterial-for-this-test-case"
        inadmissible_purpose = (
            f"{EMAIL_ADDRESS_CONFIRMATION} + {ACCESS} + {PASSWORD_RESET}"
        )

        # Act.
        with self.assertRaises(ValueError) as context_manager:
            __ = validate_token(token, inadmissible_purpose)

        # Assert.
        self.assertEqual(
            str(context_manager.exception),
            (
                "`purpose` must be one of"
                " \"to reset account's password\", 'to confirm email address',"
                f" but it is equal to {repr(inadmissible_purpose)} instead"
            ),
        )

    def test_2_invalid_token(self):
        # Arrange.
        u_r: UserResource = self.util_create_user(
            self.username, self.email, self.password
        )

        valid_token_correct_purpose = (
            self._issue_valid_email_address_confirmation_token(u_r.id)
        )
        invalid_token_correct_purpose = valid_token_correct_purpose[:-1]

        # Act.
        rv = self.client.post(
            f"/api/confirm-email-address/{invalid_token_correct_purpose}"
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "The provided token is invalid.",
            },
        )

    def test_3_valid_token_wrong_purpose(self):
        # Arrange.
        u_r: UserResource = self.util_create_user(
            self.username, self.email, self.password
        )

        for wrong_purpose in (PASSWORD_RESET, ACCESS):
            with self.subTest():
                token_payload = {
                    "purpose": wrong_purpose,
                    "user_id": u_r.id,
                }
                valid_token_wrong_purpose = (
                    self.app.token_serializer_for_email_address_confirmation.dumps(
                        token_payload
                    ).decode("utf-8")
                )

                # Act.
                rv = self.client.post(
                    f"/api/confirm-email-address/{valid_token_wrong_purpose}"
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
                            "The provided token's `purpose` is"
                            f" different from {repr(EMAIL_ADDRESS_CONFIRMATION)}."
                        ),
                    },
                )

    def test_4_valid_token(self):
        # Arrange.
        u_r: UserResource = self.util_create_user(
            self.username,
            self.email,
            self.password,
        )

        valid_token_correct_purpose = (
            self._issue_valid_email_address_confirmation_token(u_r.id)
        )

        # Act.
        rv = self.client.post(
            f"/api/confirm-email-address/{valid_token_correct_purpose}"
        )

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

        # (Reach directly into the application's persistence layer to)
        # Ensure that
        # a User resource has been not only created but also successfully confirmed.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = users[0]
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "is_confirmed"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "is_confirmed": True,
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user.password_hash, "123"),
        )

        self.assertEqual(repr(user), "User(1, jd)")


class Test_03_GetUsers(TestBasePlusUtilities):
    """Test the request responsible for getting a list of existing User resources."""

    def test_1_empty_database(self):
        """
        Ensure that, when the database doesn't contain any User resources,
        getting a list of User resources doesn't return any.
        """

        # Get all User resources.
        rv = self.client.get("/api/users")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        with current_app.test_request_context():
            _links_self = url_for("api_blueprint.get_users", per_page=10, page=1)
            _links_first = _links_self
        self.assertEqual(
            body,
            {
                "items": [],
                "_meta": {
                    "total_items": 0,
                    "per_page": 10,
                    "total_pages": 0,
                    "page": 1,
                },
                "_links": {
                    "self": _links_self,
                    "next": None,
                    "prev": None,
                    "first": _links_first,
                    "last": None,
                },
            },
        )

    def test_2_empty_database(self):
        """
        Ensure that,
        when none of the `User` resources that are present in the database
        has confirmed its email address,
        getting a list of `User` resources will return an empty list.
        """

        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"
        __ = self.util_create_user(username, email, password)

        # Act.
        rv = self.client.get("/api/users")

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        with current_app.test_request_context():
            _links_self = url_for("api_blueprint.get_users", per_page=10, page=1)
        self.assertEqual(
            body,
            {
                "items": [],
                "_meta": {
                    "total_items": 0,
                    "per_page": 10,
                    "total_pages": 0,
                    "page": 1,
                },
                "_links": {
                    "self": _links_self,
                    "next": None,
                    "prev": None,
                    "first": _links_self,
                    "last": None,
                },
            },
        )

    def test_3_nonempty_database(self):
        """
        Ensure that, when the database contains some `User` resources,
        getting a list of `User` resources returns only those
        whose email addresses have been confirmed.
        """

        # Arrange.
        data_1 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_2 = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }

        __ = self.util_create_user(
            data_1["username"],
            data_1["email"],
            data_1["password"],
            should_confirm_email_address=True,
        )
        __ = self.util_create_user(
            data_2["username"],
            data_2["email"],
            data_2["password"],
        )

        # Act.
        rv = self.client.get("/api/users")

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        with current_app.test_request_context():
            _links_self = url_for("api_blueprint.get_users", per_page=10, page=1)
        self.assertEqual(
            body,
            {
                "items": [
                    {
                        "id": 1,
                        "username": "jd",
                    }
                ],
                "_meta": {
                    "total_items": 1,
                    "per_page": 10,
                    "total_pages": 1,
                    "page": 1,
                },
                "_links": {
                    "self": _links_self,
                    "next": None,
                    "prev": None,
                    "first": _links_self,
                    "last": _links_self,
                },
            },
        )


class Test_04_GetUser(TestBasePlusUtilities):
    """Test the request responsible for getting one specific User resource."""

    def test_1_nonexistent_user(self):
        """
        Ensure that
        attempting to get a User resource, which doesn't exist, returns a 404.
        """
        rv = self.client.get("/api/users/1")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": "There doesn't exist a User resource with an id of 1.",
            },
        )

    def test_2_user_that_exists(self):
        """
        Ensure that
        attempting to get a User resource, which exists but has not been confirmed,
        returns a 404.
        """

        # Create one User resource.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"
        __ = self.util_create_user(username, email, password)

        # Get the User resource that was created just now.
        rv = self.client.get("/api/users/1")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": "There doesn't exist a User resource with an id of 1.",
            },
        )

    def test_3_user_that_exists(self):
        """
        Ensure that,
        when the database contains some User resources that have been confirmed,
        it is possible to get a specific confirmed User resource.
        """

        # Create one User resource and confirm it.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        __ = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        # Get the User resource that was created just now.
        rv = self.client.get("/api/users/1")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "id": 1,
                "username": "jd",
            },
        )


class Test_05_EditUser(TestBasePlusUtilities):
    """Test the request responsible for editing a specific User resource."""

    def setUp(self):
        self.data = {
            "username": "JD",
            "password": "!@#",
        }
        self.data_str = json.dumps(self.data)
        super().setUp()

    def test_01_missing_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing Basic Auth credentials.
        """

        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"
        __ = self.util_create_user(username, email, password)

        # Act.
        # Attempt to edit the User resource, which was created just now,
        # without prodiving Basic Auth credentials.
        rv = self.client.put(
            "/api/users/1",
            data=self.data_str,
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user.password_hash, "123"),
        )

    def test_02_unconfirmed_email_address(self):
        """
        Ensure that, if a `User`
            (a) provides valid authentication,
            (b) attempts to edit his/her own `User` resource, but
            (c) has not confirmed his/her email address,
        then the response should be a 400.
        """
        # TODO: (2023/05/24, 06:40)
        #       write another test case that
        #       is similar to this one
        #       but attempts to edit the email address
        #       and asserts that no `EmailAddressChange` object has been created.
        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"
        __ = self.util_create_user(username, email, password)

        # Act.
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/1",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
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

    def test_03_missing_content_type(self):
        """
        Ensure that it is impossible to edit a confirmed User resource
        without providing a 'Content-Type: application/json' header.
        """

        # TODO: (2023/03/06, 07:29)
        #       resolve v-t-i-67
        #       :=
        #       update the comments within test cases
        #       to be organized around the "Arrange-Act-Assert" 'scaffolding'

        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        __ = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        # Act.
        # Attempt to edit the User resource, which was created just now,
        # without prodiving a 'Content-Type: application/json' header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/1",
            data=self.data_str,
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
                    "Your request did not include"
                    ' a "Content-Type: application/json" header.'
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user.password_hash, "123"),
        )

    def test_04_prevent_editing_of_another_user(self):
        """
        Ensure that it is impossible to edit a confirmed User resource,
        which does not correspond to
        the user authenticated by the issued request's header
        - regardless of whether the targeted User resource is confirmed or not.
        """

        # Arrange.
        data_1 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_2 = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }
        data_3 = {
            "username": "at",
            "email": "alice.taylor@protonmail.com",
            "password": "789",
        }

        u_r_1: UserResource = self.util_create_user(
            data_1["username"],
            data_1["email"],
            data_1["password"],
            should_confirm_email_address=True,
        )
        u_r_2: UserResource = self.util_create_user(
            data_2["username"],
            data_2["email"],
            data_2["password"],
            should_confirm_email_address=True,
        )
        u_r_3: UserResource = self.util_create_user(
            data_3["username"],
            data_3["email"],
            data_3["password"],
        )

        # Act.
        basic_auth_credentials = f"{u_r_1.email}:{u_r_1.password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_2 = self.client.put(
            f"/api/users/{u_r_2.id}",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        rv_3 = self.client.put(
            f"/api/users/{u_r_3.id}",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        # Assert.
        for rv in (rv_2, rv_3):
            body_str = rv.get_data(as_text=True)
            body = json.loads(body_str)

            self.assertEqual(rv.status_code, 403)
            self.assertEqual(
                body,
                {
                    "error": "Forbidden",
                    "message": (
                        "You are not allowed to edit any User resource different from"
                        " your own."
                    ),
                },
            )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 3)

        user_2 = User.query.get(2)
        self.assertEqual(
            {
                a: getattr(user_2, a)
                for a in ("id", "username", "email", "is_confirmed")
            },
            {
                "id": 2,
                "username": "ms",
                "email": "mary.smith@protonmail.com",
                "is_confirmed": True,
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user_2.password_hash, "456"),
        )

        user_3 = User.query.get(3)
        self.assertEqual(
            {
                a: getattr(user_3, a)
                for a in ("id", "username", "email", "is_confirmed")
            },
            {
                "id": 3,
                "username": "at",
                "email": "alice.taylor@protonmail.com",
                "is_confirmed": False,
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user_3.password_hash, "789"),
        )

    def test_05_prevent_editing_of_authenticated_user(self):
        """
        Ensure that the user,
        who has been confirmed and is authenticated by the issued request's header,
        is unable to edit _both_ the email address _and_ the username and/or password
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

        for data in (
            {
                "email": "JOHN.DOE@PROTONMAIL.COM",
                "username": "JD",
            },
            {
                "email": "JOHN.DOE@PROTONMAIL.COM",
                "password": "abc",
            },
            {
                "email": "JOHN.DOE@PROTONMAIL.COM",
                "username": "JD",
                "password": "abc",
            },
        ):
            with self.subTest():
                # Act.
                basic_auth_credentials = f"{email}:{password}"
                b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode(
                    "utf-8"
                )
                authorization = "Basic " + b_a_c

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

                self.assertEqual(rv.status_code, 400)
                self.assertEqual(
                    body,
                    {
                        "error": "Bad Request",
                        "message": (
                            "You are not allowed to edit _both_ your email address _and_ your "
                            "username and/or password with a single request to this endpoint. "
                            "To achieve that effect, you have to issue two separate requests "
                            "to this endpoint."
                        ),
                    },
                )

                # (Reach directly into the application's persistence layer to)
                # Ensure that the User resource, which was targeted, did not get edited.
                user = User.query.get(u_r.id)
                self.assertEqual(user.username, u_r.username)
                self.assertTrue(
                    flsk_bcrpt.check_password_hash(user.password_hash, u_r.password),
                )
                self.assertEqual(user.email, u_r.email)

    def test_06_edit_username_and_password_of_authenticated_user(self):
        """
        Ensure that the user,
        who has been confirmed and is authenticated by the issued request's header,
        is able to edit the username and password
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
        rv = self.client.put(
            f"/api/users/{u_r.id}",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "id": 1,
                "username": "JD",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, got edited successfully.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        edited_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(edited_u, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "JD",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(edited_u.password_hash, "!@#"),
        )

    def test_07_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to edit a confirmed User resource
        by providing an incorrect set of Basic Auth credentials.
        """

        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        __ = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        # Act.
        basic_auth_credentials = f"{email}:something-different-from-{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/1",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 1)
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

    def test_08_prevent_duplication_of_usernames(self):
        """
        Ensure that it is impossible to edit a confirmed User resource in such a way
        that two different User resources would end up having the same username
        - regardless of whether the latter User resource is confirmed or not.
        """

        # Arrange.
        data_1 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_2 = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }
        data_3 = {
            "username": "at",
            "email": "alice.taylor@protonmail.com",
            "password": "789",
        }

        u_r_1: UserResource = self.util_create_user(
            data_1["username"],
            data_1["email"],
            data_1["password"],
            should_confirm_email_address=True,
        )
        u_r_2: UserResource = self.util_create_user(
            data_2["username"],
            data_2["email"],
            data_2["password"],
            should_confirm_email_address=True,
        )
        u_r_3: UserResource = self.util_create_user(
            data_3["username"],
            data_3["email"],
            data_3["password"],
        )

        # Act.
        basic_auth_credentials = f"{u_r_1.email}:{u_r_1.password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        new_data_2 = {"username": u_r_2.username}
        new_data_str_2 = json.dumps(new_data_2)
        rv_2 = self.client.put(
            f"/api/users/{u_r_1.id}",
            data=new_data_str_2,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        new_data_3 = {"username": u_r_3.username}
        new_data_str_3 = json.dumps(new_data_3)
        rv_3 = self.client.put(
            f"/api/users/{u_r_1.id}",
            data=new_data_str_3,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        # Assert.
        for rv in (rv_2, rv_3):
            body_str = rv.get_data(as_text=True)
            body = json.loads(body_str)
            self.assertEqual(rv.status_code, 400)
            self.assertEqual(
                body,
                {
                    "error": "Bad Request",
                    "message": (
                        "There already exists a User resource with the same username as"
                        " the one you provided."
                    ),
                },
            )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 3)
        targeted_u = User.query.get(u_r_1.id)
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


class Test_06_DeleteUser(TestBasePlusUtilities):
    """Test the request responsible for deleting a specific User resource."""

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource without providing Basic
        Auth credentials.
        """

        # Create one User resource.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"
        __ = self.util_create_user(username, email, password)

        # Attempt to delete the User resource, which was created just now,
        # without prodiving Basic Auth credentials.
        rv = self.client.delete("/api/users/1")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get deleted.
        users = User.query.all()
        self.assertEqual(len(users), 1)
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

    def test_2_unconfirmed_email_address(self):
        """
        Ensure that, if a `User`
            (a) provides valid authentication,
            (b) attempts to delete his/her own `User` resource, but
            (c) has not confirmed his/her email address,
        then the response should be a 400.
        """

        # Arrange.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"
        __ = self.util_create_user(username, email, password)

        # Act.
        basic_auth_credentials = f"{email}:{password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/1",
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

    def test_3_prevent_deleting_of_another_user(self):
        """
        Ensure that it is impossible to edit a User resource,
        which does not correspond to
        the user authenticated by the issued request's header.
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

        # Attempt to delete a User resource, which does not correspond to
        # the user authenticated by the issued request's header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/2", headers={"Authorization": authorization}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 403)
        self.assertEqual(
            body,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to delete any User resource different from"
                    " your own."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get deleted.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        targeted_u = User.query.get(2)
        self.assertEqual(
            {a: getattr(targeted_u, a) for a in ["id", "username", "email"]},
            {
                "id": 2,
                "username": "ms",
                "email": "mary.smith@protonmail.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(targeted_u.password_hash, "456"),
        )

    def test_4_delete_the_authenticated_user(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to delete his/her corresponding User resource.
        """

        # Create one User resource and confirm it.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        __ = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        # Delete a User resource.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/1", headers={"Authorization": authorization}
        )

        body_str = rv.get_data(as_text=True)
        self.assertEqual(rv.status_code, 204)
        self.assertEqual(body_str, "")

        # (Reach directly into the application's persistence layer to)
        # Ensure that the targeted User resource has indeed been deleted.
        users = User.query.all()
        self.assertEqual(len(users), 0)

    def test_5_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource
        by providing an incorrect set of Basic Auth credentials.
        """

        # Create one User resource and confirm it.
        username = "jd"
        email = "john.doe@protonmail.com"
        password = "123"

        __ = self.util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        # Attempt to delete a User resource
        # by providing an incorrect set of Basic Auth credentials.
        basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/1", headers={"Authorization": authorization}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get deleted.
        users = User.query.all()
        self.assertEqual(len(users), 1)
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


class Test_07_RequestPasswordReset(TestBasePlusUtilities):
    """
    Test the request responsible for requesting a password reset for a user,
    who wishes or needs to reset her password.
    """

    def setUp(self):
        super().setUp()

        username_1 = "jd"
        email_1 = "john.doe@protonmail.com"
        password_1 = "123"
        self._u_r_1 = self.util_create_user(username_1, email_1, password_1)

    def test_1_missing_content_type(self):
        # Act.
        payload = {
            "email": self._u_r_1.email,
        }
        payload_str = json.dumps(payload)

        rv = self.client.post(
            "/api/request-password-reset",
            data=payload_str,
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
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            },
        )

    def test_2_incomplete_request_body(self):
        # Act.
        payload = {
            "not email": "john.doe@protonmail.com",
        }
        payload_str = json.dumps(payload)

        rv = self.client.post(
            "/api/request-password-reset",
            data=payload_str,
            headers={
                "Content-Type": "application/json",
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
                "message": "Your request's body didn't specify a value for 'email'.",
            },
        )

    def test_3_nonexistent_user(self):
        # Act.
        payload = {
            "email": "mary.smith@protonmail.com",
        }
        payload_str = json.dumps(payload)

        rv = self.client.post(
            "/api/request-password-reset",
            data=payload_str,
            headers={
                "Content-Type": "application/json",
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
                "message": "The email you provided is invalid.",
            },
        )

    def test_4_unconfirmed_email_address(self):
        with patch(
            "src.api.users.send_email",
            return_value=None,
        ) as send_email_mock:
            # Act.
            payload = {
                "email": self._u_r_1.email,
            }
            payload_str = json.dumps(payload)

            rv = self.client.post(
                "/api/request-password-reset",
                data=payload_str,
                headers={
                    "Content-Type": "application/json",
                },
            )

            # Assert.
            body_str = rv.get_data(as_text=True)
            body = json.loads(body_str)

            self.assertEqual(send_email_mock.call_count, 0)
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

    def test_5_request_password_reset(self):
        # Arrange.
        username_2 = "ms"
        email_2 = "mary.smith@protonmail.com"
        password_2 = "456"
        u_r_2 = self.util_create_user(
            username_2, email_2, password_2, should_confirm_email_address=True
        )

        with patch(
            "src.api.users.send_email",
            return_value=None,
        ) as send_email_mock:
            # Act.
            payload = {
                "email": u_r_2.email,
            }
            payload_str = json.dumps(payload)

            rv = self.client.post(
                "/api/request-password-reset",
                data=payload_str,
                headers={
                    "Content-Type": "application/json",
                },
            )

            # Assert.
            body_str = rv.get_data(as_text=True)
            body = json.loads(body_str)

            self.assertEqual(send_email_mock.call_count, 1)
            self.assertEqual(rv.status_code, 202)
            self.assertEqual(
                body,
                {
                    "message": "Sending an email with instructions for resetting your password..."
                },
            )


class Test_08_ResetPassword(TestBase):
    """
    Test the request responsible for resetting a user's password.
    """

    def setUp(self):
        super().setUp()

        # Create one user.
        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        __ = self.client.post(
            "/api/users",
            data=json.dumps(user_data),
            headers={
                "Content-Type": "application/json",
            },
        )

    def test_1_expired_token(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.side_effect = SignatureExpired(
                "forced via mocking/patching"
            )

            payload = {"new_password": "456"}
            rv = self.client.post(
                "/api/reset-password/token-for-resetting-password",
                data=json.dumps(payload),
                headers={
                    "Content-Type": "application/json",
                },
            )

            self.assertEqual(rv.status_code, 401)
            self.assertEqual(
                json.loads(rv.get_data(as_text=True)),
                {
                    "error": "Unauthorized",
                    "message": "The provided token is invalid.",
                },
            )

    def test_2_bad_signature(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.side_effect = BadSignature(
                "forced via mocking/patching"
            )

            payload = {"new_password": "456"}
            rv = self.client.post(
                "/api/reset-password/token-for-resetting-password",
                data=json.dumps(payload),
                headers={
                    "Content-Type": "application/json",
                },
            )

            self.assertEqual(rv.status_code, 401)
            self.assertEqual(
                json.loads(rv.get_data(as_text=True)),
                {
                    "error": "Unauthorized",
                    "message": "The provided token is invalid.",
                },
            )

    def test_3_valid_token_wrong_purpose(self):
        for wrong_purpose in (EMAIL_ADDRESS_CONFIRMATION, ACCESS):
            with self.subTest():
                with patch(
                    "src.TimedJSONWebSignatureSerializer.loads",
                ) as serializer_loads_mock:
                    # Arrange.
                    serializer_loads_mock.return_value = {
                        "purpose": wrong_purpose,
                        "user_id": 1,
                    }

                    # Act.
                    payload = {"new_password": "456"}
                    payload_str = json.dumps(payload)

                    rv = self.client.post(
                        "/api/reset-password/token-for-resetting-password",
                        data=payload_str,
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
                                "The provided token's `purpose` is"
                                f" different from {repr(PASSWORD_RESET)}."
                            ),
                        },
                    )

    def test_4_missing_content_type(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            # Arrange.
            serializer_loads_mock.return_value = {
                "purpose": PASSWORD_RESET,
                "user_id": 1,
            }

            # Act.
            payload = {"new_password": "456"}
            payload_str = json.dumps(payload)

            rv = self.client.post(
                "/api/reset-password/token-for-resetting-password",
                data=payload_str,
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
                        'Your request did not include a "Content-Type: application/json"'
                        " header."
                    ),
                },
            )

    def test_5_incomplete_request_body(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.return_value = {
                "purpose": PASSWORD_RESET,
                "user_id": 1,
            }

            payload = {"not new_password": "456"}
            rv = self.client.post(
                "/api/reset-password/token-for-resetting-password",
                data=json.dumps(payload),
                headers={
                    "Content-Type": "application/json",
                },
            )

            self.assertEqual(rv.status_code, 400)
            self.assertEqual(
                json.loads(rv.get_data(as_text=True)),
                {
                    "error": "Bad Request",
                    "message": (
                        "Your request's body didn't specify a value for a 'new_password'."
                    ),
                },
            )

    def test_6_reset_password(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.return_value = {
                "purpose": PASSWORD_RESET,
                "user_id": 1,
            }

            payload = {"new_password": "456"}
            rv = self.client.post(
                "/api/reset-password/token-for-resetting-password",
                data=json.dumps(payload),
                headers={
                    "Content-Type": "application/json",
                },
            )

            self.assertEqual(rv.status_code, 200)
            self.assertEqual(
                json.loads(rv.get_data(as_text=True)),
                {
                    "message": "You have reset your password successfully.",
                },
            )
