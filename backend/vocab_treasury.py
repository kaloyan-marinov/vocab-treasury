from flask import Flask


app = Flask(__name__)


users_list = [
    {
        "id": "1",
        "username": "jd",
        "email": "john.doe@gmail.com",
        "password": "123",
    },
    {
        "id": "2",
        "username": "ms",
        "email": "mary.smith@yahoo.com",
        "password": "456",
    },
]


users = {u["id"]: u for u in users_list}


@app.route("/api/users", methods=["GET"])
def get_users():
    return users


@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user_id_str = str(user_id)
    return users[user_id_str]


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
