---
title: "How To Stream Postgres, MySQL Changes To Elasticsearch (via Kafka)"
date: 2021-08-28T11:41:03.284Z
description: "How To Stream Postgres, MySQL Changes To Kafka, How To Connect Postgres, MySQL and Kafka, How To Connect Postgres and Elasticsearch"
tags: "postgres, mysql, kafka, elasticsearch, debezium, cdc"
---

<div style="display:flex;align-items:center;padding-left:10%;padding-right:10%;padding-bottom:32px;">
    <div style="width:30%;">
        <img src="apache_kafka_logo.svg"
            alt="Kafka Logo"
            style="margin:0;"
            />
    </div>
        <span style="font-size: 64px;padding-left:16px;padding-right:32px;">+</span>
    <div style="width:50%;padding-top:32px;">
    <img src="elasticsearch_logo.svg"
        alt="Elasticsearch Logo"
        />
    </div>
</div>

1. [Postgres Setup](#postgres-setup)
2. [MySQL Setup](#mysql-setup)

This is the second post from [change data capture](https://en.wikipedia.org/wiki/Change_data_capture) series. You can read more about the motivation and introduction into Debezium in the [previous post](https://www.spektor.dev/how-to-stream-mongodb-changes-to-kafka/).

In this post I will show how to set up Debezium with Postgres and MySQL databases. As in the [previous post](https://www.spektor.dev/how-to-stream-mongodb-changes-to-kafka/) the prerequisites are Debezium and Kafka images.

Postgres and MySQL official images will be used:

```yml
version: "3"
services:
  kafdrop:
    image: obsidiandynamics/kafdrop
    restart: "no"
    ports:
      - "9000:9000"
    environment:
      KAFKA_BROKERCONNECT: "kafka:29092"
      JVM_OPTS: "-Xms16M -Xmx48M -Xss180K -XX:-TieredCompilation -XX:+UseStringDeduplication -noverify"
    depends_on:
      - "kafka"

  kafka:
    image: obsidiandynamics/kafka
    restart: "no"
    ports:
      - "2181:2181"
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_LISTENERS: "INTERNAL://:29092,EXTERNAL://:9092"
      KAFKA_ADVERTISED_LISTENERS: "INTERNAL://kafka:29092,EXTERNAL://localhost:9092"
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: "INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT"
      KAFKA_INTER_BROKER_LISTENER_NAME: "INTERNAL"
      KAFKA_ZOOKEEPER_SESSION_TIMEOUT: "6000"
      KAFKA_RESTART_ATTEMPTS: "10"
      KAFKA_RESTART_DELAY: "5"
      ZOOKEEPER_AUTOPURGE_PURGE_INTERVAL: "0"

  connect:
    image: debezium/connect:1.6
    ports:
      - 8083:8083
    environment:
      - BOOTSTRAP_SERVERS=kafka:29092
      - GROUP_ID=connect-cluster
      - CONFIG_STORAGE_TOPIC=my_connect_configs
      - OFFSET_STORAGE_TOPIC=my_connect_offsets
      - STATUS_STORAGE_TOPIC=my_connect_statuses
    depends_on:
      - "kafka"
      - "postgres"
      - "mysql"

  postgres:
    image: postgres:12.7
    restart: "no"
    container_name: postgres
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    command: ["sleep", "1000000"]

  # superuser `root` is created automatically with the password as the value of `MYSQL_ROOT_PASSWORD` parameter
  mysql:
    image: mysql:5.7
    restart: "no"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: mydb
      MYSQL_USER: admin
      MYSQL_PASSWORD: mypass
    container_name: mysql
    volumes:
      - "./my.cnf:/etc/mysql/my.cnf"

  adminer:
    depends_on:
      - postgres
      - mysql
    image: adminer
    restart: "no"
    ports:
      - 8080:8080
```

Notice that `mysql` service uses a file `my.cnf`:

```
[mysqld]

server-id         = 223344
log_bin           = mysql-bin
binlog_format     = ROW
binlog_row_image  = FULL
expire_logs_days  = 10

!includedir /etc/mysql/conf.d/
!includedir /etc/mysql/mysql.conf.d/
```

This is MySQL config file which enables [binlog](https://debezium.io/documentation/reference/1.6/connectors/mysql.html#enable-mysql-binlog). In addition `adminer` service is a handy database client with web interface which will allow us to connect to databases.

As opposed to MongoDB update events, Postgres and MySQL update events contain the values of all of the table columns, that is you get the full row. This can be very handy in some cases. As in MongoDB, the connectors start by reading every existing row from relevant tables and send a `READ` event for each row.

<a name="postgres-setup"></a>

### Postgres Setup

As you may have noticed the docker command for Postgres container is `sleep`. This is because Postgres configuration needs to be changed and then Postgres server needs to be restarted. If the docker command was starting Postgres then killing Postgres process would cause docker container to exit which is not what we want. Here're the steps to enable [logical decoding](https://www.postgresql.org/docs/9.4/logicaldecoding-explanation.html) in Postgres (this is necessary in order for Debezium to intercept data changes):

- Run `docker exec -it postgres /bin/bash`
- Start Postgres process `/usr/local/bin/docker-entrypoint.sh -c 'shared_buffers=256MB' -c 'max_connections=200'`
- Visit `localhost:8080` (adminer) and enter the login details for Postgres: (System=PostgreSQL, Server=postgres, Username=postgres, Password=postgres, Database=postgres)
- Click on "SQL Command" and run this query: `SHOW wal_level;`. This will show `replica` but what we need is `logical`. Therefore run again: `ALTER SYSTEM SET wal_level = logical;`
- Restart Postgres process by killing it and running again `/usr/local/bin/docker-entrypoint.sh -c 'shared_buffers=256MB' -c 'max_connections=200'`
- Verify that `SHOW wal_level;` now returns `logical`

The last step is to create the Debezium connector:

```bash
curl --location --request POST 'http://localhost:8083/connectors' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "postgres-connector",
    "config": {
        "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
        "database.hostname": "postgres",
        "database.port": "5432",
        "database.user": "postgres",
        "database.password": "postgres",
        "database.dbname": "postgres",
        "database.server.name": "postgres-server-name",
        "plugin.name": "pgoutput"
    }
}'
```

We can now create a test table to verify that the connector works:

```sql
CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    name VARCHAR (50),
    age SMALLINT
);

INSERT INTO "test" ("name", "age")
VALUES ('Paul McCartney', '79');
```

Now if we visit `http://localhost:9000/` a topic `postgres-server-name.public.test` will contain a message with the inserted data (🔥).

<a name="mysql-setup"></a>

### MySQL Setup

MySQL setup is the easiest, the only thing left to do is to create the Debezium connector:

```bash
curl --location --request POST 'http://localhost:8083/connectors' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "mysql-connector",
    "config": {
        "connector.class": "io.debezium.connector.mysql.MySqlConnector",
        "database.hostname": "mysql",
        "database.port": "3306",
        "database.user": "root",
        "database.password": "rootpass",
        "database.server.id": "184054",
        "database.server.name": "mysql-server-name",
        "database.history.kafka.bootstrap.servers": "kafka:29092",
        "database.history.kafka.topic": "dbhistory.schema-changes",
        "include.schema.changes": "false"
    }
}'
```

We can now verify the connector by inserting some test data. First connect to the MySQL instance from adminer:

- Go to `http://localhost:8080`
- The login details are System=MySQL, Server=mysql, Username=admin, Password=mypass, Database=mydb

Once inside adminer sample data my be created:

```sql
CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    name VARCHAR (50),
    age SMALLINT
);

INSERT INTO test (name, age)
VALUES ('Paul McCartney', '79');
```

If we visit `http://localhost:9000/` a new topic will appear `mysql-server-name.mydb.test` which will contain a message with the inserted data (🔥).
