from flask import Flask


app = Flask(__name__)


@app.route("/")
def home():
    return "Hello world!"


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
