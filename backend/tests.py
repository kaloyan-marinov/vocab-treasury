import unittest
import json

# from unittest.mock import patch
import base64
import os

os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite://"


from backend.vocab_treasury import public_representation, app, users, db, User


app.config["TESTING"] = True


class TestUtils(unittest.TestCase):
    def test_public_representation(self):
        user = {
            "id": "1",
            "username": "jd",
            "email": "john.doe@gmail.com",
            "password": "123",
        }
        p_r_of_user = public_representation(user)
        self.assertEqual(p_r_of_user, {"id": "1", "username": "jd"})


class TestApp(unittest.TestCase):
    def setUp(self):
        db.drop_all()  # just in case
        db.create_all()
        self.client = app.test_client()

    def tearDown(self):
        db.drop_all()

    def test_get_users(self):
        rv = self.client.get("/api/users")
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {},
        )

    def test_get_user(self):
        # Attempt to get a User resource that doesn't exist.
        rv_1 = self.client.get("/api/users/17")
        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        self.assertEqual(rv_1.status_code, 404)
        self.assertEqual(
            body_1,
            {
                "error": "Not Found",
                "message": "There doesn't exist a User resource with an id of 17",
            },
        )

        # Get a User resource.
        data = {"username": "jd", "email": "john.doe@gmail.com", "password": "123"}
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users", data=data_str, headers={"Content-Type": "application/json"}
        )
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 201)
        self.assertEqual(body, {"id": 1, "username": "jd"})

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

    def test_create_user(self):
        data = {
            "username": "fl",
            "email": "first.last@protonmail.com",
            "password": "789",
        }
        data_str = json.dumps(data)

        # Attempt to create a User resource without providing a
        # 'Content-Type: application/json' header.
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

        # fmt: off
        '''
        # Attempt to create a User resource with the same email as an existing User
        # resource.
        data_2 = {
            "id": 3,
            "username": "dupicate.email",
            "email": "john.doe@gmail.com",
            "password": "dupicate.email",
        }
        data_2_str = json.dumps(data_2)

        rv = self.client.post(
            "api/users", data=data_2_str, headers={"Content-Type": "application/json"}
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
        '''
        # fmt: on

        # Create a User resource.
        # mock_of_extra_user = {
        #     "17": {
        #         "id": "17",
        #         "username": "eu",
        #         "email": "extra.user@mock.com",
        #         "password": "10,11,12",
        #     },
        # }
        # with patch.dict(
        #     "backend.vocab_treasury.users", values=mock_of_extra_user
        # ) as users_mock:
        if True:
            rv_1 = self.client.post(
                "/api/users",
                data=data_str,
                headers={"Content-Type": "application/json"},
            )

            # user_created_by_1 = users["18"]

            rv_2 = self.client.get("/api/users")

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        self.assertEqual(rv_1.status_code, 201)
        self.assertEqual(
            body_1,
            {
                "id": 1,
                "username": "fl",
            },
        )

        # Attempt to create a User resource with the same email as an existing User
        # resource.
        data_2 = {
            "id": 3,
            "username": "dupicate.email",
            "email": "first.last@protonmail.com",
            "password": "dupicate.email",
        }
        data_2_str = json.dumps(data_2)

        rv = self.client.post(
            "api/users", data=data_2_str, headers={"Content-Type": "application/json"}
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

        user_created_by_1 = User.query.get(1)
        self.assertEqual(
            {
                a: getattr(user_created_by_1, a)
                for a in ["id", "username", "email", "password"]
            },
            {
                "id": 1,
                "username": "fl",
                "email": "first.last@protonmail.com",
                "password": "789",
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2,
            {
                "1": {
                    "id": 1,
                    "username": "fl",
                },
            },
        )

        # rv_3 = self.client.get("/api/users")
        # body_str_3 = rv_3.get_data(as_text=True)
        # body_3 = json.loads(body_str_3)
        # self.assertEqual(
        #     body_3,
        #     {
        #         "1": {
        #             "id": "1",
        #             "username": "jd",
        #         },
        #         "2": {
        #             "id": "2",
        #             "username": "ms",
        #         },
        #     },
        # )

    def test_edit_user(self):
        data = {"username": "JD", "email": "JOHN.DOE@GMAIL.COM", "password": "!@#"}
        data_str = json.dumps(data)

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

            # Attempt to edit a User resource
            # without prodiving Basic Auth credentials.
            rv_1 = self.client.put("/api/users/1", data=data_str)

            # Attempt to edit a User resource without providing a
            # 'Content-Type: application/json' header.
            basic_auth_credentials = "john.doe@gmail.com:123"
            b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode(
                "utf-8"
            )
            authorization = "Basic " + b_a_c
            rv_2 = self.client.put(
                "/api/users/1", data=data_str, headers={"Authorization": authorization}
            )

            # Attempt to edit a User resource, which does not correspond to
            # the user authenticated by the issued request's header.
            rv_3 = self.client.put(
                "/api/users/2",
                data=data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": authorization,
                },
            )

            # Attempt to edit a User resource that doesn't exist.
            rv_4 = self.client.put(
                "/api/users/17",
                data=data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": authorization,
                },
            )

            # Edit a User resource.
            rv_5 = self.client.put(
                "/api/users/1",
                data=data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": authorization,
                },
            )

            # Get the edited User resource
            # (by reaching directly into the application's persistence layer).
            edited_user_5 = User.query.get(1)

            # Get the edited User resource
            # (by having the test client issue an HTTP request).
            rv_6 = self.client.get("/api/users/1")

            # Attempt to edit a User resource in such a way that two different User
            # resources would end up having the same email.
            basic_auth_credentials_7 = "mary.smith@yahoo.com:456"
            b_a_c_7 = base64.b64encode(basic_auth_credentials_7.encode("utf-8")).decode(
                "utf-8"
            )
            authorization_7 = "Basic " + b_a_c_7

            data_7 = {"email": edited_user_5.email}
            data_str_7 = json.dumps(data_7)

            rv_7 = self.client.put(
                "/api/users/2",
                data=data_str_7,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": authorization_7,
                },
            )

            # Attempt to edit a User resource
            # by providing an incorrect set of Basic Auth credentials.
            basic_auth_credentials_8 = "mary.smith@yahoo.com:wrong-password"
            b_a_c_8 = base64.b64encode(basic_auth_credentials_8.encode("utf-8")).decode(
                "utf-8"
            )
            authorization_8 = "Basic " + b_a_c_8

            rv_8 = self.client.put(
                "/api/users/2",
                data=data_str_7,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": authorization_8,
                },
            )

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

        body_str_6 = rv_6.get_data(as_text=True)
        body_6 = json.loads(body_str_6)
        self.assertEqual(rv_6.status_code, 200)
        self.assertEqual(body_6, {"id": 1, "username": "JD"})

        body_str_7 = rv_7.get_data(as_text=True)
        body_7 = json.loads(body_str_7)
        self.assertEqual(rv_7.status_code, 400)
        self.assertEqual(
            body_7,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same email as the"
                    " one you provided."
                ),
            },
        )

        body_str_8 = rv_8.get_data(as_text=True)
        body_8 = json.loads(body_str_8)
        self.assertEqual(rv_8.status_code, 401)
        self.assertEqual(
            body_8,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

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

            # Attempt to delete a User resource
            # without providing Basic Auth credentials.
            rv_1 = self.client.delete("/api/users/1")

            # Attempt to delete a User resource, which does not correspond to
            # the user authenticated by the issued request's header.
            basic_auth_credentials = "john.doe@gmail.com:123"
            b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode(
                "utf-8"
            )
            authorization = "Basic " + b_a_c

            rv_2 = self.client.delete(
                "/api/users/2", headers={"Authorization": authorization}
            )

            # Attempt to delete a User resource that doesn't exist.
            rv_3 = self.client.delete(
                "/api/users/17", headers={"Authorization": authorization}
            )

            # Delete a User resource.
            rv_4 = self.client.delete(
                "/api/users/1", headers={"Authorization": authorization}
            )

            # Attempt to get the deleted User resource.
            rv_5 = self.client.get("/api/users/1")

            # Get all remaining User resources.
            rv_6 = self.client.get("/api/users")

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

        body_str_4 = rv_4.get_data(as_text=True)
        self.assertEqual(rv_4.status_code, 204)
        self.assertEqual(body_str_4, "")

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
