#!/bin/bash
set -e
cd "$(dirname "$0")"

if (( $# < 1 ))
then
  echo "Usage: $0 up|down|verbose|logs [service_name]"
  exit 1
fi

# create pg data dir
if [ ! -d pgdata ]; then
  echo creating data dir...
  mkdir pgdata;
fi

COMMAND=$1

# copy /etc/passwd to a temp file readable by non-root
ETC_PASSWD=`mktemp`
cp /etc/passwd $ETC_PASSWD

RUNAS_UID="$(id -u)"
RUNAS_GID="$(id -g)"

case $COMMAND in
    verbose)
        ETC_PASSWD=$ETC_PASSWD RUNAS_UID=$RUNAS_UID RUNAS_GID=$RUNAS_GID docker compose -f docker-compose-rootless.yml --verbose up 
    ;;
    up)
        ETC_PASSWD=$ETC_PASSWD RUNAS_UID=$RUNAS_UID RUNAS_GID=$RUNAS_GID docker compose -f docker-compose-rootless.yml up -d
    ;;
    down)
        ETC_PASSWD=$ETC_PASSWD RUNAS_UID=$RUNAS_UID RUNAS_GID=$RUNAS_GID docker compose -f docker-compose-rootless.yml down
    ;;
    logs)
        if [ -z "$2" ]; then
            echo "Error: service name is required for logs command."
            echo "Usage: $0 logs <service_name>"
            exit 1
        fi
        ETC_PASSWD=$ETC_PASSWD RUNAS_UID=$RUNAS_UID RUNAS_GID=$RUNAS_GID docker compose -f docker-compose-rootless.yml logs -f "$2"
    ;;
    *)
        echo "Invalid command: $COMMAND"
        echo "Usage: $0 up|down|verbose|logs [service_name]"
        exit 1
    ;;
esac