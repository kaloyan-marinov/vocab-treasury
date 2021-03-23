import unittest


from backend.vocab_treasury import app


class TestApp(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_index(self):
        rv = self.client.get("/")
        body_str = rv.get_data()
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(body_str, b"Hello world!")
