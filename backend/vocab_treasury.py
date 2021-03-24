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
    return {
        u_id: {"id": u["id"], "username": u["username"]} for u_id, u in users.items()
    }


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

    email = request.json.get("email")
    is_email_taken = False
    for user in users.values():
        if user["email"] == email:
            is_email_taken = True
            break
    if is_email_taken:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same email as"
                    " the one you provided."
                ),
            }
        )
        r.status_code = 400
        return r

    new_user_id = max([int(u_id) for u_id in users.keys()]) + 1
    new_user_id_str = str(new_user_id)
    payload = {k: v for k, v in request.json.items()}
    payload["id"] = new_user_id_str

    users[new_user_id_str] = payload

    r = jsonify(payload)
    r.status_code = 201
    return r


@app.route("/api/users/<int:user_id>", methods=["PUT"])
def edit_user(user_id):
    if not request.json:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
            }
        )
        r.status_code = 400
        return r

    user_id_str = str(user_id)
    if user_id_str not in users:
        r = jsonify(
            {
                "error": "Not Found",
                "message": f"There doesn't exist a User resource with an id of {user_id_str}",
            }
        )
        r.status_code = 404
        return r

    email = request.json.get("email")
    if email:
        is_email_taken = False
        for user in users.values():
            if user["email"] == email:
                is_email_taken = True
                break
        if is_email_taken:
            r = jsonify(
                {
                    "error": "Bad Request",
                    "message": (
                        "There already exists a User resource with the same email as"
                        " the one you provided."
                    ),
                }
            )
            r.status_code = 400
            return r

    original_user = users[user_id_str]
    edited_user = {**original_user, **request.json}
    users[user_id_str] = edited_user

    return edited_user


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user_id_str = str(user_id)
    if user_id_str not in users:
        r = jsonify(
            {
                "error": "Not Found",
                "message": f"There doesn't exist a User resource with an id of {user_id}",
            }
        )
        r.status_code = 404
        return r

    del users[user_id_str]

    return "", 204


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
