import unittest
import json

# from unittest.mock import patch
import base64
import os

os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite://"


from backend.vocab_treasury import app, db, User


app.config["TESTING"] = True


class TestBase(unittest.TestCase):
    def setUp(self):
        db.drop_all()  # just in case
        db.create_all()
        self.client = app.test_client()

    def tearDown(self):
        db.drop_all()


class Test_1_CreateUser(TestBase):
    def test_1_require_content_type(self):
        """
        Ensure that it is impossible to create a User resource
        without providing a 'Content-Type: application/json' header.
        """
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post("api/users", data=data_str)

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

    def test_2_create_user(self):
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 201)
        self.assertEqual(
            body,
            {
                "id": 1,
                "username": "jd",
            },
        )

        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = users[0]
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "password"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )

    def test_3_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to create a User resource,
        which has the same email as an existing User resource.
        """

        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to create a second User resource with the same email as the User
        # resource that was created just now.
        data_2 = {
            "username": "different-username",
            "email": "john.doe@protonmail.com",
            "password": "different-password",
        }
        data_2_str = json.dumps(data_2)

        rv_2 = self.client.post(
            "/api/users", data=data_2_str, headers={"Content-Type": "application/json"}
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 400)
        self.assertEqual(
            body_2,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same email as the"
                    " one you provided."
                ),
            },
        )


class Test_2_GetUsers(TestBase):
    def test_1_empty_database(self):
        rv = self.client.get("/api/users")
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {},
        )

    def test_2_nonempty_database(self):
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Get all User resources.
        rv = self.client.get("/api/users")
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "1": {
                    "id": 1,
                    "username": "jd",
                }
            },
        )


class Test_3_GetUser(TestBase):
    def test_1_nonexistent_user(self):
        """
        Ensure that
        attempting to get a User resource that doesn't exist returns a 404.
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
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Get the User resource that was created just now.
        rv_2 = self.client.get("/api/users/1")
        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2,
            {
                "id": 1,
                "username": "jd",
            },
        )


class Test_4_EditUser(TestBase):
    def setUp(self):
        self.data = {"username": "JD", "email": "JOHN.DOE@GMAIL.COM", "password": "!@#"}
        self.data_str = json.dumps(self.data)
        super().setUp()

    def test_1_require_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing Basic Auth credentials.
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=self.data_str,
            headers={"Content-Type": "application/json"},
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

    def test_2_require_content_type(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing a 'Content-Type: application/json' header.
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to edit the User resource, which was created just now,
        # without prodiving a 'Content-Type: application/json' header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv_2 = self.client.put(
            "/api/users/1", data=self.data_str, headers={"Authorization": authorization}
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 400)
        self.assertEqual(
            body_2,
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
            },
        )

    def test_3_prevent_editing_of_another_user(self):
        """
        Ensure that it is impossible to edit a User resource,
        which does not correspond to
        the user authenticated by the issued request's header.
        """
        # Create two User resources.
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

        data_0 = {
            "username": "ms",
            "email": "mary.smith@yahoo.com",
            "password": "456",
        }
        data_str_0 = json.dumps(data_0)
        rv_0 = self.client.post(
            "/api/users",
            data=data_str_0,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to edit a User resource, which does not correspond to
        # the user authenticated by the issued request's header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_3 = self.client.put(
            "/api/users/2",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 403)
        self.assertEqual(
            body_3,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to edit any User resource different from your"
                    " own."
                ),
            },
        )

    def test_4_nonexistent_user(self):
        """
        Ensure that
        attempting to edit a User resource that doesn't exist returns a 404.

        TODO: consider removing this test altogether, because:

            1) its description contradicts its actual status-code assertion

            2) it is somewhat pointless, since the implementation of `edit_user()`
               allows only the authenticated user to edit only his/her corresponding
               User resource
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Identify a non-existent User resource.
        nonexistent_user_id = 17

        user = User.query.get(nonexistent_user_id)
        self.assertIsNone(user)

        # Attempt to edit a User resource that doesn't exist.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_4 = self.client.put(
            f"/api/users/{nonexistent_user_id}",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str_4 = rv_4.get_data(as_text=True)
        body_4 = json.loads(body_str_4)
        self.assertEqual(rv_4.status_code, 403)
        self.assertEqual(
            body_4,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to edit any User resource different from your"
                    " own."
                ),
            },
        )

    def test_5_edit_the_authenticated_user(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to edit his/her corresponding User resource.
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Edit the User resource that was created just now.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_5 = self.client.put(
            "/api/users/1",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str_5 = rv_5.get_data(as_text=True)
        body_5 = json.loads(body_str_5)
        self.assertEqual(rv_5.status_code, 200)
        self.assertEqual(
            body_5,
            {
                "id": 1,
                "username": "JD",
            },
        )

        # Get the edited User resource
        # (by reaching directly into the application's persistence layer).
        edited_user_5 = User.query.get(1)
        self.assertEqual(
            {
                a: getattr(edited_user_5, a)
                for a in ["id", "username", "email", "password"]
            },
            {
                "id": 1,
                "username": "JD",
                "email": "JOHN.DOE@GMAIL.COM",
                "password": "!@#",
            },
        )

        # Get the edited User resource
        # (by having the test client issue an HTTP request).
        rv_6 = self.client.get("/api/users/1")

        body_str_6 = rv_6.get_data(as_text=True)
        body_6 = json.loads(body_str_6)
        self.assertEqual(rv_6.status_code, 200)
        self.assertEqual(body_6, {"id": 1, "username": "JD"})

    def test_6_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to edit a User resource in such a way
        that two different User resources would end up having the same email.
        """
        # Create two User resources.
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

        data_0 = {
            "username": "ms",
            "email": "mary.smith@yahoo.com",
            "password": "456",
        }
        data_str_0 = json.dumps(data_0)
        rv_0 = self.client.post(
            "/api/users",
            data=data_str_0,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to edit a User resource, which does not correspond to
        # the user authenticated by the issued request's header.
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

    def test_7_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        by providing an incorrect set of Basic Auth credentials.
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to edit a User resource
        # by providing an incorrect set of Basic Auth credentials.
        basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv = self.client.put(
            "/api/users/1",
            data=self.data,
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


class Test_5_DeleteUser(TestBase):
    def test_1_require_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource without providing Basic
        Auth credentials.
        """
        rv_1 = self.client.delete("/api/users/1")

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        self.assertEqual(rv_1.status_code, 401)
        self.assertEqual(
            body_1,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

        # TODO: reach _directly_ into the database here

    def test_2_prevent_deleting_of_another_user(self):
        # Create two User resources.
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

        data_0 = {
            "username": "ms",
            "email": "mary.smith@yahoo.com",
            "password": "456",
        }
        data_str_0 = json.dumps(data_0)
        rv_0 = self.client.post(
            "/api/users",
            data=data_str_0,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to delete a User resource, which does not correspond to
        # the user authenticated by the issued request's header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_2 = self.client.delete(
            "/api/users/2", headers={"Authorization": authorization}
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 403)
        self.assertEqual(
            body_2,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to delete any User resource different from"
                    " your own."
                ),
            },
        )

    def test_3_nonexistent_user(self):
        """
        Ensure that
        attempting to delete a User resource that doesn't exist returns a 404.

        TODO: consider removing this test altogether, because:

            1) its description contradicts its actual status-code assertion

            2) it is somewhat pointless, since the implementation of `delete_user()`
               allows only the authenticated user to delete only his/her corresponding
               User resource
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to delete a User resource that doesn't exist.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_3 = self.client.delete(
            "/api/users/17", headers={"Authorization": authorization}
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 403)
        self.assertEqual(
            body_3,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to delete any User resource different from"
                    " your own."
                ),
            },
        )

    def test_4_delete_the_authenticated_user(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to delete his/her corresponding User resource.
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Delete a User resource.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_4 = self.client.delete(
            "/api/users/1", headers={"Authorization": authorization}
        )

        body_str_4 = rv_4.get_data(as_text=True)
        self.assertEqual(rv_4.status_code, 204)
        self.assertEqual(body_str_4, "")

        # TODO: reach _directly_ into the database too

    def test_5_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource
        by providing an incorrect set of Basic Auth credentials.
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to delete a User resource
        # by providing an incorrect set of Basic Auth credentials.
        basic_auth_credentials_7 = "mary.smith@yahoo.com:wrong-password"
        b_a_c_7 = base64.b64encode(basic_auth_credentials_7.encode("utf-8")).decode(
            "utf-8"
        )
        authorization_7 = "Basic " + b_a_c_7

        rv_7 = self.client.delete(
            "/api/users/2", headers={"Authorization": authorization_7}
        )

        body_str_7 = rv_7.get_data(as_text=True)
        body_7 = json.loads(body_str_7)
        self.assertEqual(rv_7.status_code, 401)
        self.assertEqual(
            body_7,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )


class Test_9_App(TestBase):
    def test_delete_user(self):
        # with patch.dict("backend.vocab_treasury.users") as users_mock:
        if True:
            data_0 = {
                "username": "jd",
                "email": "john.doe@gmail.com",
                "password": "123",
            }
            data_str_0 = json.dumps(data_0)
            rv_0 = self.client.post(
                "/api/users",
                data=data_str_0,
                headers={"Content-Type": "application/json"},
            )

            data_0 = {
                "username": "ms",
                "email": "mary.smith@yahoo.com",
                "password": "456",
            }
            data_str_0 = json.dumps(data_0)
            rv_0 = self.client.post(
                "/api/users",
                data=data_str_0,
                headers={"Content-Type": "application/json"},
            )

            """
            # Attempt to get the deleted User resource.
            rv_5 = self.client.get("/api/users/1")

            # Get all remaining User resources.
            rv_6 = self.client.get("/api/users")
            """

        """
        body_str_5 = rv_5.get_data(as_text=True)
        body_5 = json.loads(body_str_5)
        self.assertEqual(rv_5.status_code, 404)
        self.assertEqual(
            body_5,
            {
                "error": "Not Found",
                "message": "There doesn't exist a User resource with an id of 1",
            },
        )

        body_str_6 = rv_6.get_data(as_text=True)
        body_6 = json.loads(body_str_6)
        self.assertEqual(rv_6.status_code, 200)
        self.assertEqual(
            body_6,
            {
                "2": {
                    "id": 2,
                    "username": "ms",
                }
            },
        )
        """
