from flask import Flask, request, jsonify


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


@app.route("/api/users", methods=["POST"])
def create_user():
    if not request.json:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
            }
        )
        r.status_code = 400
        return r
    else:
        new_user_id = max([int(u_id) for u_id in users.keys()]) + 1
        new_user_id_str = str(new_user_id)
        payload = {k: v for k, v in request.json.items()}
        payload["id"] = new_user_id_str

        users[new_user_id_str] = payload

        r = jsonify(payload)
        r.status_code = 201
        return r


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
