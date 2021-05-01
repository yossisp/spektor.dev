---
title: "How To Solve GraphQL N+1 Problem By Using Custom Dataloaders"
date: 2021-05-1T11:41:03.284Z
description: "How To Solve GraphQL N+1 Problem Using Dataloader and Using MongoDB"
tags: "mongodb, graphql, optimization, dataloader"
---

Many have heard about the famous N+1 problem in GraphQL. It often occurs when queries include relationships between entities, especially child-parent. For example, let's say we want to make a GraphQL query for a list of purchases and the buyers in some supermarket.

Below are the entities definition in GraphQL SDL:

```graphql
type Buyer {
  id: ID!
  name: String!
}

type Purchase {
  id: ID!
  buyerID: ID!
  paymentAmount: Float!
}

type Query {
  buyer(id: ID!): Buyer
  purchases: [Purchase]!
}
```

Let's say we want to make the following query:

```graphql
{
  query {
    purchases {
      paymentAmount
      buyer {
        name
      }
    }
  }
}
```

In a typical implementation of GraphQL relationships (regardless of the framework be it [Prisma.io](https://www.prisma.io/) or [graphql-compose](https://github.com/graphql-compose/graphql-compose)) the `purchases` resolver will not contain the logic which fetches the buyer. Rather a relationship will be defined in the GraphQL library of your choice such that `buyer` resolver will automatically be called in order to provide `buyer` data to the `purchases` resolver.

In order to find the buyer of a given purchase we first need to obtain the buyer id from `Purchase` entity because in GraphQL an entity only has access to its parent. Suppose that the data is stored in a MongoDB database. First a query is made for a list of all purchases (let's say there're `N` purchases). Then for each individual purchase a `buyer` resolver is called. Therefore, N+1 queries are made to the database (one for the list of purchases and N for each buyer).

This is of course extremely inefficient because once the list of purchases along with buyer id's is known just one MongoDB query needs to be performed in order to obtain the array of buyers.

If only there was a way to accumulate the buyer queries and delegate their execution to some logic which would perform the lookups and seamlessly integrate the result into `purchases` resolver. Indeed such a way exists and it's called a [dataloader](https://github.com/graphql/dataloader). This project was originally developed at Facebook and is not limited solely to GraphQL but rather to any use case where one needs to group and delay queries execution until some point (it can be applied to REST architecture as well). However, it is especially useful when solving the N+1 problem. In short, instead of executing `buyer` resolver per each purchase, the buyer id is loaded int
o the dataloader. Once the purchases list is known, dataloader exposes the list of buyer ids to the callback provided to it. The callback can then make a MongoDB query to fetch the list of all relevant buyers and return them. Dataloader then takes care of merging the buyers with purchases! We've now gone from N+1 queries to the database to just 2. 🎉

Below is my implementation of the dataloader for a project which uses [ApolloServer](https://www.apollographql.com/docs/apollo-server/) and [graphql-compose-mongoose](https://github.com/graphql-compose/graphql-compose-mongoose).

Firstly, it's handy to have the dataloader helpers available at ApolloServer `context` so that they can always be used with whatever entity without the need of importing the `createDataLoaders` in each file (`createDataLoaders` returns an object of dataloaders, its implementation is below):

```js
const server = new ApolloServer({
  schema: mySchema,
  context: async ({ req, res }) => {
    return {
      dataLoader: createDataLoaders(),
    }
  },
})
```

This is the `Purchase` model:

```js
import { composeWithMongoose } from "graphql-compose-mongoose"
import { Purchase } from "./mongooseModels"

const PurchaseTC = composeWithMongoose(Purchase)

const purchasesResolver = "purchases"
PurchaseTC.addResolver({
  name: purchasesResolver,
  type: PurchaseTC,
  resolve: async ({ source, args, context, info }) => Purchase.find({}).lean(),
})

// define the relationship between Purchase and Buyer
PurchaseTC.addFields({
  buyer: {
    type: "Buyer!",
    resolve: async (source, args, context, info) => {
      return (
        // if buyer already exists then no need to look it up
        // (it could exist because another Purchase resolver might perform
        // an aggregation of purchases and buyers)
        source.buyer ||
        // source here includes all purchase data, including buyer id
        context.dataLoader.purchaseToBuyer.load({ source, args, context, info })
      )
    },
  },
})

schemaComposer.Query.addFields({
  [purchasesResolver]: PurchaseTC.getResolver(purchasesResolver),
})
```

Finally, this is the implementation of the `purchaseToBuyer` dataloader:

```js
import DataLoader from "dataloader"
import { Buyer } from "./mongooseModels"

/*
 There are a few constraints dataloader batch function must uphold:
 1. The Array of values must be the same length as the Array of keys.
 2. Each value in the array of values must correspond to the same key in the array of keys.
 */

const getPurchaseToBuyerDataLoader = () =>
  new DataLoader(
    // purchaseResolverParams is an array of graphql-compose-mongoose resolver params
    async purchaseResolverParams => {
      const relevantBuyers = await Buyer.find({
        id: {
          $in: purchaseResolverParams.map(
            resolverParams => resolverParams.source.buyerID
          ),
        },
      }).lean()
      // the map is used to quickly get the buyer based on the buyer id below
      const buyersMap = new Map()
      relevantBuyers.forEach(buyer => buyersMap.set(buyer.id, buyer))
      return new Promise(resolve => {
        resolve(
          purchaseResolverParams.map(resolverParams => {
            const purchase = resolverParams.source
            const buyer = buyersMap.get(purchase.buyerID)
            return (
              buyer ||
              new Error(`buyer for purchase id '${purchase.id}' not found`)
            )
          })
        )
      })
    },
    {
      // dataloader caches objects with same key
      cacheKeyFn: key => key.source.buyerID,
    }
  )

export const createDataLoaders = () => ({
  purchaseToBuyer: getPurchaseToBuyerDataLoader(),
})
```

It can easily be checked that the above solution performs only 2 MongoDB queries using database logs. First the appropriate MongoDB log level needs to be set in order to observe all query executions: run this `db.setLogLevel(2)` on your db in MongoDB shell. I personally like to to use [NoSQLBooster for MongoDB](https://nosqlbooster.com) because it provides a nice GUI to track MongoDB queries.
