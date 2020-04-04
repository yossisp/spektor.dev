---
title: "How To Set Up prisma.io With Existing Mongodb Database"
date: "2020-03-27T19:19:03.284Z"
description: "How To Set Up prisma.io With Existing Mongodb Database"
---

[Prisma](https://www.prisma.io/) does a lot of cool stuff but I think it's primarily known for allowing to perform CRUD operations on a database via GraphQL. It started out with support for SQL databases but it now supports Mongodb as well.

**Prisma is great because it automatically:**

1. creates queries/mutations/subscriptions for each GraphQL type.
2. allows for powerful options to select the required documents.
3. creates input types which correspond to the declared entity types (useful in mutations).

Although several tutorials exist on how to create new mongodb instance from scratch and hook it up to prisma, I couldn't find comprehensive tutorials on how to connect prisma to an existing database so I hope this guide will help someone.

First, create a folder in your project called `prisma`. Add docker-compose file `prisma-server.yml` with the following content:

```yaml
version: "3"
services:
  prisma:
    image: prismaGraphQL/prisma:1.34
    restart: always
    ports:
      - "4466:4466"
    environment:
      PRISMA_CONFIG: |
        managementApiSecret: __YOUR_MANAGEMENT_API_SECRET__
        port: 4466
        databases:
          default:
            connector: mongo
            uri: mongodb://pathToYourDb/admin
            database: yourDbName
```

A couple of notes:

1. `managementApiSecret` is needed to enable authentication of requests to prisma server.
2. For local developement on Mac, you need to define `uri` as `mongodb://host.docker.internal:27017/admin` assuming your mongodb instance is running on the host machine itself. This is because prisma is running from a docker instance and docker's networking namespace is not the same as of your host machine. On Linux you can use `host` [option](https://docs.docker.com/network/network-tutorial-host/) when starting docker container.
3. Fun fact: you may be wondering what the vertical slash (`|`) is for. In YAML files it is used for multi-line input. So `PRISMA_CONFIG` is just one big string.

You can start the prisma server by `docker-compose -f prisma-server.yml up -d` from inside `prisma` folder.

Now install prisma cli tool `npm i -g prisma`. Add another file in the prisma folder called `prisma.yml` and paste the content into it:

```
endpoint: http://localhost:4466
datamodel: datamodel.prisma
databaseType: document
generate:
    - generator: javascript-client
      output: ./generated/prisma-client/
```

The file contains deployment and cofiguration settings for prisma service. It's important to specify `databaseType` as document because we're dealing with mongodb.

The last major step is to generate `datamodel.prisma` file. `datamodel.prisma` is prisma's representation of your GraphQL schema. It's based on SDL but adds some directives of its own. If you're starting with a clean database you would just write the GraphQL schema for each collection from scratch. But if you have a lot of collections it would be a more time-consuming process. Luckily, prisma cli comes with `introspect` option which will help generate the datamodel from existing documents. The generation is done by random sampling of existing documents (looks like [50](https://github.com/prisma/prisma/issues/3529)). My generated datamodel was very accurate and definitely saved a lot of time.

When you run `prisma introspect` the cli starts an interactive session where you first select the type of database you have (mongodb in our case). Then you need to enter your mongodb connection string which was `mongodb://localhost:27017/yourDbName` and lastly you need to select the schema you want to introspect which is `yourDbName`. Finally, prisma cli will create a file `datamodel-id.prisma`. Rename it to `datamodel.prisma` to match the name in `prisma.yml`.

The next step is to run `prisma generate`. This will take the datamodel you defined and generate the prisma client which can be used in your application in order to write custom resolvers and perform advanced queries/mutations. In my case client generation failed because of the error with incorrect `scalarList` directive setting. For example, one of type fields had:

```
method: [String] @scalarList(strategy: RELATION)
```

This won't work in NoSQL database like mongodb therefore

```
method: [String] @scalarList(strategy: EMBEDDED)
```

needs to be specified in `datamodel.prisma`. Lastly, run `prisma deploy` to deploy all the settings. This is it, you can now go to `http://localhost:4466` to open prisma GraphQL playground and shoot some queries. If you want to find out more about using mongodb with prisma check out this [page](https://www.prisma.io/docs/datamodel-and-migrations/datamodel-MONGO-knun/#sdl-directives) and [this](https://www.prisma.io/docs/releases-and-maintenance/features-in-preview/mongodb-b6o5/).
