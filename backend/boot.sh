#!/bin/bash
# this script is used to boot a Docker container

while true; do
    flask db upgrade

    if [[ "$?" == "0" ]]; then
        break
    fi
    
    echo Failed to apply the database migrations, trying in 5 secs...
    sleep 5
done

exec gunicorn \
    -b :5000 \
    --access-logfile - \
    --error-logfile - \
    "src:create_app()"
