import unittest

from vocab_treasury import create_app


class FlaskTestCase(unittest.TestCase):

    def setUp(self):
        app = create_app()
        self.tester = app.test_client(self)

    def test_home_1(self):
        """Ensure that the 1st address of the home page loads correctly."""
        self._test_basics('/', b'Welcome to VocabTreasury!')

    def test_home_2(self):
        """Ensure that the 2nd address of the home page loads correctly."""
        self._test_basics('/home', b'Welcome to VocabTreasury!')

    def _test_basics(self, route, expected_data):
        response = self.tester.get(route, content_type='html/text')
        with self.subTest('status code of the response'):
            self.assertEqual(200, response.status_code)
        with self.subTest('actual data returned'):
            self.assertTrue(expected_data in response.data)

    def test_about(self):
        """Ensure that the about page loads correctly."""
        self._test_basics('/about', b'About VocabTreasury...')


if __name__ == '__main__':
    unittest.main()
