#!/bin/sh
set -eu

for topic in fortune.requested.v1 fortune.completed.v1 content.published.v1 fortune.requested.v1.DLT fortune.completed.v1.DLT content.published.v1.DLT; do
    /opt/kafka/bin/kafka-topics.sh \
        --bootstrap-server kafka:29092 \
        --create --if-not-exists \
        --topic "$topic" --partitions 3 --replication-factor 1
done
