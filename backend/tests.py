import unittest
import json
from unittest.mock import patch
import base64
import os
from itsdangerous import TimedJSONWebSignatureSerializer, SignatureExpired, BadSignature
from flask import url_for


TESTING_SECRET_KEY = "testing-secret-key"
os.environ["SECRET_KEY"] = TESTING_SECRET_KEY
# This is a working but also hacky way of configuring the application instance
# for the situation when
# one wishes to run the tests for the backend sub-project.
os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite://"


from vocab_treasury import app, db, flask_bcrypt, User, Example


app.config["TESTING"] = True

# fmt: off
'''
print(
    "os.environ.get('SECRET_KEY') - "
    + os.environ.get("SECRET_KEY")
)
'''
# fmt: on


class TestBase(unittest.TestCase):
    def setUp(self):
        db.drop_all()  # just in case
        db.create_all()
        self.client = app.test_client()

    def tearDown(self):
        db.drop_all()


class Test_01_CreateUser(TestBase):
    """"Test the request responsible for creating a new User resource."""

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

        # Attempt to create a User resource
        # without providing a 'Content-Type: application/json' header.
        rv = self.client.post("api/users", data=self.data_str)

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 17)
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
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(
            flask_bcrypt.check_password_hash(user.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(user.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(user.password_hash, "123"),
        )


class Test_02_GetUsers(TestBase):
    """"Test the request responsible for getting a list of existing User resources."""

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
        with app.test_request_context():
            _links_self = url_for("get_users", per_page=10, page=1)
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

    def test_2_nonempty_database(self):
        """
        Ensure that, when the database contains some User resources,
        it is possible to get a list of User resources.
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
        with app.test_request_context():
            _links_self = url_for("get_users", per_page=10, page=1)
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
            flask_bcrypt.check_password_hash(user.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(user.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(user.password_hash, "456"),
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
            flask_bcrypt.check_password_hash(edited_u.password_hash, "!@#"),
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
            flask_bcrypt.check_password_hash(targeted_u.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(targeted_u.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(user.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(targeted_u.password_hash, "123"),
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
            flask_bcrypt.check_password_hash(targeted_u.password_hash, "456"),
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
            flask_bcrypt.check_password_hash(targeted_u.password_hash, "123"),
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
        with patch("vocab_treasury.send_email", return_value=None) as send_email_mock:
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
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads"
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
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads"
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
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads"
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
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads"
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
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads"
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


class Test_08_IssueToken(TestBase):
    """
    Test the request responsible for issuing a JSON Web Signature token for a user,
    who has authenticated herself successfully as part of that same request.
    """

    def setUp(self):
        super().setUp()

        # Create one User resource.
        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        user_data_str = json.dumps(user_data)
        rv = self.client.post(
            "/api/users",
            data=user_data_str,
            headers={
                "Content-Type": "application/json",
            },
        )

        # Compute a valid token for the User resource, which was created just now.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        user_id = body["id"]

        token_serializer = TimedJSONWebSignatureSerializer(
            TESTING_SECRET_KEY, expires_in=3600
        )
        token = token_serializer.dumps({"user_id": user_id}).decode("utf-8")
        self._expected_body = {"token": token}

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible to issue a(n access) token
        without providing Basic Auth credentials.
        """

        rv = self.client.post("/api/tokens")

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

    def test_2_issue_token(self):
        """
        Ensure that a(n access) token gets issued for the user,
        who is authenticated by the issued request's header.
        """

        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        basic_auth = "Basic " + b_a_c
        rv = self.client.post("/api/tokens", headers={"Authorization": basic_auth})

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)

        # fmt: off
        '''
        At first sight, it might seem that
        the next code-block should be replaced by the single statement,
        which is currently located within the `try`-statement.
        
        Unfortunately, that would not work as expected 100% of the time.
        The reason for that is hinted at by the content of the `except`-statement,
        and that reason can be summarized as follows:
            the endpoint handler relies on a _Timed_JSONWebSignatureSerializer,
            which means that,
            if the execution of the endpoint handler takes more than 1 s,
            then (a) the observed and expected headers will not be equal to each other,
            and (b) the observed and expected cryptographic signatures will not be equal
            to each other.
        
        For that reason, the next code-block utilizes the `try`-`except` construct
        so that, even if the `try`-block's assertion fails,
        the `except`-block will make another less-stringent-but-nevertheless-meaningful
        assertion.
        '''
        # fmt: on
        try:
            self.assertEqual(body, self._expected_body)
        except AssertionError as e:
            header, payload, cryptographic_signature = body["token"].split(".")
            h_expected, p_expected, c_s_expected = self._expected_body["token"].split(
                "."
            )

            print()
            for name, value, value_expected in zip(
                ["header", "payload", "cryptographic signature"],
                [header, payload, cryptographic_signature],
                [h_expected, p_expected, c_s_expected],
            ):
                print(f"{name}s equal?   {value == value_expected}")
                print(f"{name} observed: {value}")
                print(f"{name} expected: {value_expected}")

            self.assertEqual(payload, p_expected)

    def test_3_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to issue a(n access) token
        by providing an incorrect set of Basic Auth credentials.
        """

        wrong_basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
        wrong_b_a_c = base64.b64encode(
            wrong_basic_auth_credentials.encode("utf-8")
        ).decode("utf-8")
        wrong_authorization = "Authorization " + wrong_b_a_c
        rv = self.client.post(
            "/api/tokens",
            headers={"Authorization": wrong_authorization},
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


class Test_09_GetUserProfile(TestBase):
    """
    Test the request responsible for getting the User Profile resource,
    which is associated with a given User resource.
    """

    def setUp(self):
        super().setUp()

        data = {"username": "jd", "email": "john.doe@protonmail.com", "password": "123"}
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users", data=data_str, headers={"Content-Type": "application/json"}
        )

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible for a user to get her own User Profile resource
        without providing a Bearer-Token Auth credential.
        """

        rv = self.client.get("/api/user-profile")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": (
                    "Authentication in the Bearer-Token Auth format is required."
                ),
            },
        )

    def test_2_get_user_profile(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to fetch her own User Profile resource.
        """

        # Issue an access token for the user.
        basic_auth_credentials = "john.doe@protonmail.com" + ":" + "123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        rv_1 = self.client.post(
            "/api/tokens",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Basic " + b_a_c,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        token = body_1["token"]

        # Fetch the user's own User Profile resource.
        rv_2 = self.client.get(
            "/api/user-profile", headers={"Authorization": "Bearer " + token}
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2, {"id": 1, "username": "jd", "email": "john.doe@protonmail.com"}
        )


class TestBaseForExampleResources(TestBase):
    def create_user(self, username, email, password):
        # Create one User resource.
        data_1 = {
            "username": username,
            "email": email,
            "password": password,
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/users",
            data=data_str_1,
            headers={"Content-Type": "application/json"},
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)

        # Issue an access token for the user, which was created just now.
        basic_auth_credentials = email + ":" + password
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        basic_auth = "Basic " + b_a_c
        rv_2 = self.client.post(
            "/api/tokens",
            headers={"Content-Type": "application/json", "Authorization": basic_auth},
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        token_auth = "Bearer " + body_2["token"]

        return body_1, token_auth


class Test_10_CreateExample(TestBaseForExampleResources):
    """Test the request responsible for creating a new Example resource."""

    def setUp(self):
        super().setUp()

        # Create one User resource.
        jd_user_dict, self._jd_user_token_auth = self.create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Prepare a JSON payload, which is required for creating an Example resource
        # associated with the above-created User resource.
        self._example_data = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        self._example_data_str = json.dumps(self._example_data)

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible to create an Example resource
        without providing a Bearer-Token Auth credential.
        """

        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": (
                    "Authentication in the Bearer-Token Auth format is required."
                ),
            },
        )

    def test_2_missing_content_type(self):
        """
        Ensure that it is impossible to create an Example resource
        without providing a 'Content-Type: application/json' header.
        """

        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={"Authorization": self._jd_user_token_auth},
        )

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

    def test_3_incomplete_request_body(self):
        """
        Ensure that it is impossible to create an Example resource
        without providing a value for each required field/key in the request body.
        """

        for field in ("new_word", "content"):
            # Attempt to create an Example resource
            # without providing a value for `field` in the request body.
            data_dict = {k: v for k, v in self._example_data.items() if k != field}
            data_str = json.dumps(data_dict)
            rv = self.client.post(
                "/api/examples",
                data=data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": self._jd_user_token_auth,
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
                        f"Your request body did not specify a value for '{field}'"
                    ),
                },
            )

            # (Reach directly into the application's persistence layer to)
            # Ensure that no Example resources have been created.
            examples = Example.query.all()
            self.assertEqual(len(examples), 0)

    def test_4_create_example(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to edit create an Example resource.
        """

        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 201)
        self.assertEqual(rv.headers["Location"], "http://localhost/api/examples/1")
        self.assertEqual(
            body,
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that an Example resource has been created successfully.
        examples = Example.query.all()
        self.assertEqual(len(examples), 1)
        self.assertEqual(examples[0].user_id, 1)

        self.assertEqual(repr(examples[0]), "Example(1, osallistua [+ MIHIN])")

    def test_5_incorrect_token_auth(self):
        """
        Ensure that it is impossible to create a new Example resource
        by providing an incorrect Bearer-Token Auth credential.
        """

        wrong_authorization = self._jd_user_token_auth + "-wrong"
        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": wrong_authorization,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": (
                    "Authentication in the Bearer-Token Auth format is required."
                ),
            },
        )

    def test_6_expired_token(self):
        """
        Ensure that it is impossible to create an Example resource
        by providing an expired Bearer Token.
        """

        # Simulate a request, in which a client provides an expired Bearer Token.
        with patch(
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads",
            side_effect=SignatureExpired("forced via mocking/patching"),
        ):
            rv = self.client.post(
                "/api/examples",
                data=self._example_data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": self._jd_user_token_auth,
                },
            )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach into the application's persistence layer to)
        # Ensure that the simulated request didn't create any new Example resources.
        examples = Example.query.all()
        self.assertEqual(len(examples), 0)

    def test_7_token_signature_was_tampered_with(self):
        """
        Ensure that
        it is impossible to create an Example resource by providing a Bearer Token,
        whose cryptographic signature has been tampered with.
        """

        # Simulate a request, in which a client provides a Bearer Token,
        # whose cryptographic signature has been tampered with.
        with patch(
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads",
            side_effect=BadSignature("forced via mocking/patching"),
        ):
            rv = self.client.post(
                "/api/examples",
                data=self._example_data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": self._jd_user_token_auth,
                },
            )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach into the application's persistence layer to)
        # Ensure that the simulated request didn't create any new Example resources.
        examples = Example.query.all()
        self.assertEqual(len(examples), 0)

    def test_8_token_for_nonexistent_user(self):
        """
        Ensure that
        it is impossible to create an Example resource by providing a Bearer Token,
        whose payload specifies a non-existent user ID.
        """

        # Simulate a request, in which a client provides a Bearer Token,
        # whose payload specifies a non-existent user ID.
        nonexistent_user_id = 17
        with patch(
            "vocab_treasury.TimedJSONWebSignatureSerializer.loads",
            return_value={"user_id": nonexistent_user_id},
        ):
            rv = self.client.post(
                "/api/examples",
                data=self._example_data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": self._jd_user_token_auth,
                },
            )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": (
                    "Authentication in the Bearer-Token Auth format is required."
                ),
            },
        )

        # (Reach into the application's persistence layer to)
        # Ensure that the simulated request didn't create any new Example resources.
        examples = Example.query.all()
        self.assertEqual(len(examples), 0)


class Test_11_GetExamples(TestBaseForExampleResources):
    """
    Test the request responsible for getting a list of Example resources,
    all of which are associated with a given User resource.
    """

    def setUp(self):
        super().setUp()

        # Create one User resource.
        jd_user_dict, self._jd_user_token_auth = self.create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._jd_user_id = jd_user_dict["id"]

    def test_1_no_examples_exist(self):
        """
        Given a user who doesn't have any Example resources of her own,
        ensure that, when that user requests a list of resources,
        she doesn't get any.
        """

        rv = self.client.get(
            "/api/examples", headers={"Authorization": self._jd_user_token_auth}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        with app.test_request_context():
            _links_self = url_for("get_examples", per_page=10, page=1)
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

    def test_2_some_examples_exist(self):
        """
        Given a user who has nonzero Example resources of her own,
        ensure that, when that user requests a list of resources,
        she gets page 1 of her own resources.
        """

        # Create one Example resource.
        example_data = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        example_data_str = json.dumps(example_data)
        rv_1 = self.client.post(
            "/api/examples",
            data=example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        # Get all Example resources that are associated with the only existing user.
        rv_2 = self.client.get(
            "/api/examples", headers={"Authorization": self._jd_user_token_auth}
        )

        body_2_str = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_2_str)
        self.assertEqual(rv_2.status_code, 200)
        with app.test_request_context():
            _links_self = url_for("get_examples", per_page=10, page=1)
        self.assertEqual(
            body_2,
            {
                "items": [
                    {
                        "id": 1,
                        "source_language": "Finnish",
                        "new_word": "osallistua [+ MIHIN]",
                        "content": "Kuka haluaa osallistua kilpailuun?",
                        "content_translation": "Who wants to participate in the competition?",
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

    def test_3_access_only_own_examples(self):
        """
        Ensure that each user can get a list of her own Example resources,
        but cannot get a list of another user's Example resources.
        """

        # Create a second User resource.
        ms_user_dict, ms_token_auth = self.create_user(
            username="ms", email="mary.smith@yahoo.com", password="456"
        )

        # Create one Example resource for the first user.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id_1 = body_1["id"]

        # Create one Example resource for the second user.
        data_2 = {
            "source_language": "Finnish",
            "new_word": "kieli",
            "content": "Mitä kieltä sinä puhut?",
            "content_translation": "What languages do you speak?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.post(
            "/api/examples",
            data=data_str_2,
            headers={
                "Content-Type": "application/json",
                "Authorization": ms_token_auth,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        example_id_2 = body_2["id"]

        # Ensure that the 2nd user can get all of her own Example resources,
        # but cannot get any of the Example resources that belong to another user.
        rv_3 = self.client.get(
            "/api/examples",
            headers={"Authorization": ms_token_auth},
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 200)
        example_ids_of_the_ms_user = {example["id"] for example in body_3["items"]}
        self.assertEqual(
            example_ids_of_the_ms_user,
            {2},
        )
        example_ids_of_the_jd_user = {example_id_1}
        self.assertEqual(
            example_ids_of_the_ms_user.intersection(example_ids_of_the_jd_user),
            set(),
        )

    def test_4_filter_own_resources(self):
        """
        Ensure that each user can get a filtered list of her own Example resources.
        """

        # Arrange.
        # Create own Example resources.
        # fmt: off
        list_of_example_data = [
            {"new_word": "123", "content": "456", "content_translation": "789"},
            {"new_word": "ABC", "content": "PQR", "content_translation": "XYZ"},
            {"new_word": "ABC", "content": "XYZ", "content_translation": "PQR"},
            {"new_word": "PQR", "content": "ABC", "content_translation": "XYZ"},
            {"new_word": "PQR", "content": "XYZ", "content_translation": "ABC"},
            {"new_word": "XYZ", "content": "ABC", "content_translation": "PQR"},
            {"new_word": "XYZ", "content": "PQR", "content_translation": "ABC"},
        ]
        # fmt: on
        for data_1 in list_of_example_data:
            data_str_1 = json.dumps(data_1)
            rv_1 = self.client.post(
                "/api/examples",
                data=data_str_1,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": self._jd_user_token_auth,
                },
            )

        # fmt: off
        query_param_dicts = (
            {'new_word': 'ABC', 'content': 'PQR', 'content_translation': 'XYZ'},

            {'new_word': 'ABC', 'content': 'PQR'},
            {'new_word': 'ABC',                   'content_translation': 'XYZ'},
            {                   'content': 'PQR', 'content_translation': 'XYZ'},

            {'new_word': 'ABC'},
            {                   'content': 'PQR'},
            {                                     'content_translation': 'XYZ'}
        )
        expected_id_sets = (
            {2},
            
            {2},
            {2},
            {2},

            {2, 3},
            {2, 7},
            {2, 4}
        )
        # fmt: on

        for query_param_dict, expected_id_set in zip(
            query_param_dicts, expected_id_sets
        ):
            # Act.
            query_param_str = "?" + "&".join(
                [k + "=" + v for k, v in query_param_dict.items()]
            )
            url = "/api/examples" + query_param_str
            rv_2 = self.client.get(
                url, headers={"Authorization": self._jd_user_token_auth}
            )

            body_str_2 = rv_2.get_data(as_text=True)
            body_2 = json.loads(body_str_2)

            # Assert.
            self.assertEqual({item["id"] for item in body_2["items"]}, expected_id_set)

    def test_5_pagination_of_filtered_resources(self):
        """
        Ensure that,
        when a user issues a request for a filtered list of her own Example resources,
        the response is paginated properly.
        """

        # Arrange.
        list_of_example_data = [{"new_word": x % 2, "content": x} for x in range(11)]
        for data_1 in list_of_example_data:
            data_str_1 = json.dumps(data_1)
            rv_1 = self.client.post(
                "/api/examples",
                data=data_str_1,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": self._jd_user_token_auth,
                },
            )

        # Act.
        rv_2 = self.client.get(
            "/api/examples?per_page=2&page=2&new_word=1",
            headers={"Authorization": self._jd_user_token_auth},
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)

        # Assert.
        self.maxDiff = None
        self.assertEqual(
            {
                "_meta": {
                    "total_items": 5,
                    "per_page": 2,
                    "total_pages": 3,
                    "page": 2,
                },
                "_links": {
                    "self": "/api/examples?per_page=2&page=2&new_word=1",
                    "next": "/api/examples?per_page=2&page=3&new_word=1",
                    "prev": "/api/examples?per_page=2&page=1&new_word=1",
                    "first": "/api/examples?per_page=2&page=1&new_word=1",
                    "last": "/api/examples?per_page=2&page=3&new_word=1",
                },
                "items": [
                    {
                        "id": 6,
                        "source_language": "Finnish",
                        "new_word": "1",
                        "content": "5",
                        "content_translation": None,
                    },
                    {
                        "id": 8,
                        "source_language": "Finnish",
                        "new_word": "1",
                        "content": "7",
                        "content_translation": None,
                    },
                ],
            },
            body_2,
        )


class Test_12_GetExample(TestBaseForExampleResources):
    """Test the request responsible for getting a specific Example resource."""

    def setUp(self):
        super().setUp()

        jd_user_dict, self._jd_user_token_auth = self.create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._jd_user_id = jd_user_dict["id"]

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible for a user to get a specific resource of her own
        without providing a Bearer-Token Auth credential.
        """

        # Create one Example resource.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id = body_1["id"]

        # Attempt to get the Example resource, which was created just now,
        # without providing a Bearer-Token Auth credential.
        rv_2 = self.client.get(f"/api/examples/{example_id}")

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 401)
        self.assertEqual(
            body_2,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that there is one user,
        # who has Example resources of her own.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        u = users[0]
        self.assertEqual(u.id, self._jd_user_id)

        examples = Example.query.all()
        self.assertEqual(len(examples), 1)
        e = examples[0]
        self.assertEqual(e.user_id, u.id)

    def test_2_nonexistent_example(self):
        """
        Ensure that
        attempting to get an Example resource, which doesn't exist, returns a 404.
        """

        rv = self.client.get(
            "/api/examples/1", headers={"Authorization": self._jd_user_token_auth}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": "Your User doesn't have an Example resource with an ID of 1",
            },
        )

    def test_3_example_that_exists(self):
        """Ensure that a user is able to get a specific Example resource of her own."""

        # Create one Example resource.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id = body_1["id"]

        # Get the Example resource that was created just now.
        rv_2 = self.client.get(
            f"/api/examples/{example_id}",
            headers={"Authorization": self._jd_user_token_auth},
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2,
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_4_prevent_accessing_of_foreign_example(self):
        """
        Ensure that a user cannot get a specific Example resource,
        which belongs to a different user.
        """

        # Create a second User resource.
        ms_user_dict, ms_user_token_auth = self.create_user(
            username="ms", email="mary.smith@yahoo.com", password="456"
        )

        # Create one Example resource for the second user.
        data_2 = {
            "source_language": "Finnish",
            "new_word": "kieli",
            "content": "Mitä kieltä sinä puhut?",
            "content_translation": "What languages do you speak?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.post(
            "/api/examples",
            data=data_str_2,
            headers={
                "Content-Type": "application/json",
                "Authorization": ms_user_token_auth,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        example_id_2 = body_2["id"]

        # Ensure that
        # the 1st user cannot get a specific resource, which belongs to the 2nd user.
        rv_3 = self.client.get(
            f"/api/examples/{example_id_2}",
            headers={"Authorization": self._jd_user_token_auth},
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 404)
        self.assertEqual(
            body_3,
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id_2)
                ),
            },
        )


class Test_13_EditExample(TestBaseForExampleResources):
    """Test the request responsible for editing a specific Example resource."""

    def setUp(self):
        super().setUp()

        jd_user_dict, self._jd_user_token_auth = self.create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._jd_user_id = jd_user_dict["id"]

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible to edit a specific Example resource
        without providing a Bearer-Token Auth credential.
        """

        # Create one Example resource.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id = body_1["id"]

        # Attempt to edit the Example resource, which was created just now,
        # without providing a Bearer-Token Auth credential.
        data_2 = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.put(
            f"/api/examples/{example_id}",
            data=data_str_2,
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 401)
        self.assertEqual(
            body_2,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the Example resource, which was targeted, didn't get edited.
        e = Example.query.get(example_id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example_id,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_2_missing_content_type(self):
        """
        Ensure that it is impossible to edit a Example resource
        without providing a 'Content-Type: application/json' header.
        """

        # Create one Example resource.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id = body_1["id"]

        # Attempt to edit the Example resource, which was created just now,
        # without providing a "Content-Type: application/json" header.
        data_2 = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.put(
            f"/api/examples/{example_id}",
            data=data_str_2,
            headers={
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 400)
        self.assertEqual(
            body_2,
            {
                "error": "Bad Request",
                "message": (
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)"
        # Ensure that the Example resource, which was targeted, didn't get edited.
        e = Example.query.get(example_id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example_id,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_3_edit_own_example(self):
        """
        Ensure that a user is able to edit a specific Example resource of her own.
        """

        # Create one Example resource.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id = body_1["id"]

        # Edit the Example resource, which was created just now.
        data_2 = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.put(
            f"/api/examples/{example_id}",
            data=data_str_2,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2,
            {
                "id": example_id,
                "source_language": "English",
                "new_word": "participate [in sth]",
                "content": "Who wants to participate in the competition?",
                "content_translation": "Kuka haluaa osallistua kilpailuun?",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the Example resource, which was targeted, got edited successfully.
        e = Example.query.get(example_id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example_id,
                "source_language": "English",
                "new_word": "participate [in sth]",
                "content": "Who wants to participate in the competition?",
                "content_translation": "Kuka haluaa osallistua kilpailuun?",
            },
        )

    def test_4_prevent_editing_of_foreign_example(self):
        """
        Ensure that a user cannot edit a specific Example resource,
        which belongs to a different user.
        """

        # Create a second User resource.
        ms_user_dict, ms_user_token_auth = self.create_user(
            username="ms", email="mary.smith@yahoo.com", password="456"
        )

        # Create one Example resource for the second user.
        data_2 = {
            "source_language": "Finnish",
            "new_word": "kieli",
            "content": "Mitä kieltä sinä puhut?",
            "content_translation": "What languages do you speak?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.post(
            "/api/examples",
            data=data_str_2,
            headers={
                "Content-Type": "application/json",
                "Authorization": ms_user_token_auth,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        example_id_2 = body_2["id"]

        # Ensure that
        # the 1st user cannot edit a specific resource, which belongs to the 2nd user.
        data_3 = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str_3 = json.dumps(data_3)
        rv_3 = self.client.put(
            f"/api/examples/{example_id_2}",
            data=data_str_3,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 404)
        self.assertEqual(
            body_3,
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id_2)
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the Example resource, which was targeted, didn't get edited.
        e = Example.query.get(example_id_2)
        self.assertEqual(
            e.to_dict(),
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "kieli",
                "content": "Mitä kieltä sinä puhut?",
                "content_translation": "What languages do you speak?",
            },
        )


class Test_14_DeleteExample(TestBaseForExampleResources):
    """Test the request responsible for deleting a specific Example resource."""

    def setUp(self):
        super().setUp()

        jd_user_dict, self._jd_user_token_auth = self.create_user(
            username="jd", email="john.doe@gmail.com", password="123"
        )
        self._jd_user_id = jd_user_dict["id"]

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible to delete a specific Example resource
        without providing a Bearer-Token Auth credential.
        """

        # Create one Example resource.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id = body_1["id"]

        # Attempt to delete the Example resource, which was created just now,
        # without providing a Bearer-Token Auth credential.
        rv_2 = self.client.delete(f"/api/examples/{example_id}")

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 401)
        self.assertEqual(
            body_2,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the Example resource, which was targeted, did not get deleted.
        e = Example.query.get(example_id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example_id,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_2_delete_own_example(self):
        """
        Ensure that a user is able to delete a specific Example of her own.
        """

        # Create one Example resource.
        data_1 = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._jd_user_token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id = body_1["id"]

        # Delete the Example resource, which was created just now.
        rv_2 = self.client.delete(
            f"/api/examples/{example_id}",
            headers={"Authorization": self._jd_user_token_auth},
        )

        body_str_2 = rv_2.get_data(as_text=True)
        self.assertEqual(rv_2.status_code, 204)
        self.assertEqual(body_str_2, "")

        # (Reach directly into the application's persistence layer to)
        # Ensure that the Example resource, which was targeted, got deleted
        # successfully.
        e = Example.query.get(example_id)
        self.assertIsNone(e)

    def test_3_prevent_deleting_of_foreign_example(self):
        """
        Ensure that a user cannot delete a specific Example resource,
        which belongs to a different user.
        """

        # Create a second User resource.
        ms_user_dict, ms_user_token_auth = self.create_user(
            username="ms", email="mary.smith@yahoo.com", password="456"
        )

        # Create one Example resource for the second user.
        data_2 = {
            "source_language": "Finnish",
            "new_word": "kieli",
            "content": "Mitä kieltä sinä puhut?",
            "content_translation": "What languages do you speak?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.post(
            "/api/examples",
            data=data_str_2,
            headers={
                "Content-Type": "application/json",
                "Authorization": ms_user_token_auth,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        example_id_2 = body_2["id"]

        # Ensure that
        # the 1st user cannot delete a specific resource, which belongs to the 2nd user.
        rv_3 = self.client.delete(
            f"/api/examples/{example_id_2}",
            headers={"Authorization": self._jd_user_token_auth},
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 404)
        self.assertEqual(
            body_3,
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id_2)
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the Example resource, which was targeted, didn't get deleted.
        e = Example.query.get(example_id_2)
        self.assertEqual(
            e.to_dict(),
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "kieli",
                "content": "Mitä kieltä sinä puhut?",
                "content_translation": "What languages do you speak?",
            },
        )
