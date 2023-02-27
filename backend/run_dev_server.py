from src import create_app


app = create_app()


db_engine = app.config["SQLALCHEMY_DATABASE_URI"].split("://")[0]
print(
    f"run_dev_server.py -"
    f" app.config['SQLALCHEMY_DATABASE_URI']={db_engine}://***:***@***:***/***"
)


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
