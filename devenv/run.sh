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

case $COMMAND in
  verbose)
      docker compose --verbose up 
  ;;
  up)
      docker compose up -d
  ;;
  down)
      docker compose down
  ;;
  logs)
      if [ -z "$2" ]; then
        echo "Error: service name is required for logs command."
        echo "Usage: $0 logs <service_name>"
        exit 1
      fi
      docker compose logs -f "$2"
  ;;
  *)
    echo "Invalid command: $COMMAND"
    echo "Usage: $0 up|down|verbose|logs [service_name]"
    exit 1
  ;;
esac