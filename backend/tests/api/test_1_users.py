import json
from unittest.mock import patch
import base64

from itsdangerous import SignatureExpired, BadSignature
from flask import url_for, current_app

from src import flsk_bcrpt, User
from tests import TestBase


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
        """Ensure that it is possible to create a new User resource."""

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


class Test_02_GetUsers(TestBase):
    """Test the request responsible for getting a list of existing User resources."""

    def _create_user(self, username, email, password):
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
        Ensure that, when the database contains only unconfirmed User resources,
        getting a list of User resources doesn't return any.
        """

        # Create one User resource.
        data_0 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str_0 = json.dumps(data_0)
        rv_0 = self.client.post(
            "/api/users",
            data=data_str_0,
            headers={"Content-Type": "application/json"},
        )

        # Get all User resources.
        rv = self.client.get("/api/users")

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
        Ensure that, when the database contains some User resources,
        getting a list of User resources returns only those that are confirmed.
        """

        # Create two User resources.
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
        for d in (data_0_1, data_0_2):
            self._create_user(d["username"], d["email"], d["password"])

        # Confirm only the first User.
        account_confirmation_token_for_user_1 = (
            self.app.token_serializer_for_password_resets.dumps({"user_id": 1}).decode(
                "utf-8"
            )
        )

        self.client.post(
            "/api/confirm-newly-created-account/"
            + account_confirmation_token_for_user_1
        )

        # Get all User resources.
        rv = self.client.get("/api/users")

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


class Test_03_GetUser(TestBase):
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
                "message": "There doesn't exist a User resource with an id of 1",
            },
        )

    def test_2_user_that_exists(self):
        """
        Ensure that, when the database contains some User resources,
        it is possible to get a specific User resource.
        """

        # Create one User resource.
        data_0 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str_0 = json.dumps(data_0)
        rv_0 = self.client.post(
            "/api/users",
            data=data_str_0,
            headers={"Content-Type": "application/json"},
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


class Test_04_EditUser(TestBase):
    """Test the request responsible for editing a specific User resource."""

    def setUp(self):
        self.data = {
            "username": "JD",
            "email": "JOHN.DOE@PROTONMAIL.COM",
            "password": "!@#",
        }
        self.data_str = json.dumps(self.data)
        super().setUp()

    def _create_user(self, username, email, password):
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

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing Basic Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to edit the User resource, which was created just now,
        # without prodiving Basic Auth credentials.
        rv = self.client.put("/api/users/1", data=self.data_str)

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

    def test_2_missing_content_type(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing a 'Content-Type: application/json' header.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to edit the User resource, which was created just now,
        # without prodiving a 'Content-Type: application/json' header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/1", data=self.data_str, headers={"Authorization": authorization}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
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

    def test_3_prevent_editing_of_another_user(self):
        """
        Ensure that it is impossible to edit a User resource,
        which does not correspond to
        the user authenticated by the issued request's header.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

        # Attempt to edit a User resource, which does not correspond to
        # the user authenticated by the issued request's header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/2",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 403)
        self.assertEqual(
            body,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to edit any User resource different from your"
                    " own."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        user = User.query.get(2)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 2,
                "username": "ms",
                "email": "mary.smith@yahoo.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(user.password_hash, "456"),
        )

    def test_4_edit_the_authenticated_user(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to edit his/her corresponding User resource.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Edit the User resource that was created just now.
        basic_auth_credentials = "john.doe@protonmail.com:123"
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
                "email": "JOHN.DOE@PROTONMAIL.COM",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(edited_u.password_hash, "!@#"),
        )

    def test_5_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to edit a User resource in such a way
        that two different User resources would end up having the same email.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

        # Attempt to edit the 1st User resource in such a way that
        # its email should be end up being identical to the 2nd User resource's email.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        data = {"email": "mary.smith@yahoo.com"}
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

    def test_6_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        by providing an incorrect set of Basic Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to edit a User resource
        # by providing an incorrect set of Basic Auth credentials.
        basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
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

    def test_7_prevent_duplication_of_usernames(self):
        """
        Ensure that it is impossible to edit a User resource in such a way
        that two different User resources would end up having the same username.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

        # Attempt to edit the 1st User resource in such a way that
        # its username would end up being identical to the 2nd User resource's username.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        data = {"username": "ms"}
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
                    "There already exists a User resource with the same username as the"
                    " one you provided."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the attempt has not created a second User resource.
        users = User.query.all()
        self.assertEqual(len(users), 2)
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


class Test_05_DeleteUser(TestBase):
    """Test the request responsible for deleting a specific User resource."""

    def _create_user(self, username, email, password):
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

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource without providing Basic
        Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

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

    def test_2_prevent_deleting_of_another_user(self):
        """
        Ensure that it is impossible to edit a User resource,
        which does not correspond to
        the user authenticated by the issued request's header.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

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
                "email": "mary.smith@yahoo.com",
            },
        )
        self.assertTrue(
            flsk_bcrpt.check_password_hash(targeted_u.password_hash, "456"),
        )

    def test_3_delete_the_authenticated_user(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to delete his/her corresponding User resource.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
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

    def test_4_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource
        by providing an incorrect set of Basic Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
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


class Test_06_RequestPasswordReset(TestBase):
    """
    Test the request responsible for requesting a password reset for a user,
    who wishes or needs to reset her password.
    """

    def setUp(self):
        super().setUp()

        # Create one User.
        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        user_data_str = json.dumps(user_data)
        _ = self.client.post(
            "/api/users",
            data=user_data_str,
            headers={
                "Content-Type": "application/json",
            },
        )

    def test_1_missing_content_type(self):
        payload = {
            "email": "john.doe@protonmail.com",
        }
        rv = self.client.post(
            "/api/request-password-reset",
            data=json.dumps(payload),
        )

        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            json.loads(rv.get_data(as_text=True)),
            {
                "error": "Bad Request",
                "message": (
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            },
        )

    def test_2_incomplete_request_body(self):
        payload = {
            "not email": "john.doe@protonmail.com",
        }
        rv = self.client.post(
            "/api/request-password-reset",
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
                "message": "Your request's body didn't specify a value for 'email'.",
            },
        )

    def test_3_nonexistent_user(self):
        payload = {
            "email": "mary.smith@protonmail.com",
        }
        rv = self.client.post(
            "/api/request-password-reset",
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
                "message": "The email you provided is invalid.",
            },
        )

    def test_4_request_password_reset(self):
        with patch(
            "src.api.users.send_email",
            return_value=None,
        ) as send_email_mock:
            payload = {
                "email": "john.doe@protonmail.com",
            }
            rv = self.client.post(
                "/api/request-password-reset",
                data=json.dumps(payload),
                headers={
                    "Content-Type": "application/json",
                },
            )

            self.assertEqual(send_email_mock.call_count, 1)
            self.assertEqual(rv.status_code, 202)
            self.assertEqual(
                json.loads(rv.get_data(as_text=True)),
                {
                    "message": "Sending an email with instructions for resetting your password..."
                },
            )


class Test_07_ResetPassword(TestBase):
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
        _ = self.client.post(
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
                    "message": "Your password-reset token is invalid.",
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
                    "message": "Your password-reset token is invalid.",
                },
            )

    def test_3_missing_content_type(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.return_value = {"user_id": 1}

            payload = {"new_password": "456"}
            rv = self.client.post(
                "/api/reset-password/token-for-resetting-password",
                data=json.dumps(payload),
            )

            self.assertEqual(rv.status_code, 400)
            self.assertEqual(
                json.loads(rv.get_data(as_text=True)),
                {
                    "error": "Bad Request",
                    "message": (
                        'Your request did not include a "Content-Type: application/json"'
                        " header."
                    ),
                },
            )

    def test_4_incomplete_request_body(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.return_value = {"user_id": 1}

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

    def test_5_reset_password(self):
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.return_value = {"user_id": 1}

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
