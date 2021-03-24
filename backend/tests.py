import unittest
import json


from backend.vocab_treasury import app


class TestApp(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_get_users(self):
        rv = self.client.get("/api/users")
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "1": {
                    "id": "1",
                    "username": "jd",
                    "email": "john.doe@gmail.com",
                    "password": "123",
                },
                "2": {
                    "id": "2",
                    "username": "ms",
                    "email": "mary.smith@yahoo.com",
                    "password": "456",
                },
            },
        )
