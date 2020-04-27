import random
import string


def random_string(n):
    """Return a random string of length n, consisting of ASCII letters and digits."""
    characters = [random.choice(string.ascii_letters + string.digits) for _ in range(n)]
    return ''.join(characters)
