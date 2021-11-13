---
title: "How To Make Requests to ksqlDB in Node.js"
date: 2021-11-13T19:41:03.284Z
description: "How To Make Requests to ksqlDB in Node.js"
tags: "ksqlDB, node.js, http2, kafka"
excerpt: "ksqlDB is an amazing tool to make SQL queries on data stored in Kafka topics (and much more). It also has a handy REST API to make queries..."
---

1. [HTTP/1.1 Version](#http1)
2. [HTTP/2](#http2)

[ksqlDB](https://docs.ksqldb.io/en/latest/) is an amazing tool to make SQL queries on data stored in Kafka topics (and much more). It also has a handy [REST API](https://docs.ksqldb.io/en/latest/developer-guide/api/) to make queries. I didn't find a lot of resources on how to make REST API query requests to ksqlDB in Node.js therefore I thought it'd be useful to write this post.

It's worth noting that there're 2 main query endpoints in ksqlDB:

- `/query`
- `/query-stream`

According to the official [docs](https://docs.ksqldb.io/en/latest/developer-guide/ksqldb-rest-api/query-endpoint/) `/query` endpoint will be deprecated so it's recommended to use the `/query-stream` alternative. However, the alternative endpoint can only be used over HTTP/2 which is great technology but using it may require some learning curve and a different mental model. The code below was written for Node.js **version 14**.

<a name="http1">HTTP/1.1</a>

If you just want to quickly try out ksqlDB query API without delving into HTTP/2 below is an example which uses the familiar `fetch` API (`node-fetch@2` npm package is used because version 3 doesn't support CommonJS syntax. CommonJS is used in the tutorial for simplicity):

```js
const fetch = require("node-fetch")
const KSQLDB_QUERY_ENDPOINT = "http://localhost:8088/query"

const main = async () => {
  try {
    const query = {
      ksql: `SELECT * FROM test_view WHERE your_column='something';`,
    }
    const response = await fetch(KSQLDB_QUERY_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/vnd.ksql.v1+json",
      },
      body: JSON.stringify(query),
    })

    const json = await response.json()
    console.log("result", json)
  } catch (error) {
    consoler.error(error)
  }
}

main()
```

`EMIT CHANGES` type queries can also be run via this endpoint however they only fetch the state of the table as of the time of the request and do not update on subsequent changes.

<a name="http2">HTTP/2</a>

`/query-stream` endpoint is used over HTTP/2. This allows to receive updates on changes to materialized views as well as run queries with `WHERE` clause. Below is a very basic implementation of ksqlDB client:

```js
const http2 = require("http2")

class KsqlDBClient {
  constructor(ksqlDBBaseUrl) {
    this.client = http2.connect(ksqlDBBaseUrl)
    this.client.on("error", error => console.error(error))
  }

  request(query) {
    const session = this.client.request({
      [http2.constants.HTTP2_HEADER_PATH]: "/query-stream",
      [http2.constants.HTTP2_HEADER_METHOD]: "POST",
      [http2.constants.HTTP2_HEADER_CONTENT_TYPE]:
        "application/vnd.ksql.v1+json",
    })

    session.setEncoding("utf8")
    session.on("data", queryResult => {
      console.log("queryResult", queryResult)
    })

    const payload = Buffer.from(JSON.stringify(query))
    session.end(payload)
  }
}

const query = {
  sql: `SELECT * FROM test_view EMIT CHANGES;`,
}
const client = new KsqlDBClient("http://localhost:8088")
client.request(query)
```

As can be seen query result is returned on `data` event.
