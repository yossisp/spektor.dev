---
title: "Deep Dive into GraphQL Request Resolution in Apollo Server"
date: 2020-04-04T13:58:03.284Z
description: "The post explains the details of how Apollo server resolves graphql requests and how graphql resolvers middleware is executed."
---

<div style="display:flex;align-items:center;padding-left:10%;padding-right:10%;">
    <div style="width:30%;">
        <img src="GraphQL_Logo.svg"
            alt="GraphQL Logo"
            style="margin:0;"
            />
    </div>
        <span style="font-size: 64px;padding-left:16px;padding-right:16px;">+</span>
    <div style="width:30%;">
    <img src="apollo.png"
        alt="Apollo Logo"
        />
    </div>
</div>

I often wanted to better understand the inner workings of [Apollo Server](https://www.apollographql.com/docs/apollo-server/). Specifically, how the resolvers integrate with Apollo because they're not part of Apollo per se but are either written manually or produced automatically by other tools (for example [prisma.io](https://www.prisma.io/) or [graphql-compose](https://graphql-compose.github.io/)). First, I will describe the process of request resolution and then I will give an example of how one may run into problems if the process is not understood clearly.

As usual everything starts with the request from the client which contains a query, mutation or a subscription. For the purposes of the article let's suppose it's a query. The central Apollo function which handles requests is `processGraphQLRequest` ([here](https://github.com/apollographql/apollo-server/blob/8dd114455925dfe177dfbfb21449bdfc658aaf1e/packages/apollo-server-core/src/requestPipeline.ts#L107)). In it Apollo parses the GraphQL query, validates it and registers hooks, if provided under [plugins](https://www.apollographql.com/docs/apollo-server/integrations/plugins/) option in `ApolloServer` [config](https://www.apollographql.com/docs/apollo-server/api/apollo-server/). Then Apollo triggers request execution in the `execute` [function](https://github.com/apollographql/apollo-server/blob/8dd114455925dfe177dfbfb21449bdfc658aaf1e/packages/apollo-server-core/src/requestPipeline.ts#L449). `execute` receives all the needed information that the GraphQL executor requires in order to return result, including the schema, the query itself, variable names and forwards the information to the executor which is where query resolution actually happens. Not surprisingly the default executor used is [graphql](https://www.npmjs.com/package/graphql) npm package but you can configure your own executor, which is not mentioned in Apollo [API reference](https://www.apollographql.com/docs/apollo-server/api/apollo-server/) but is nonetheless [possible](https://github.com/apollographql/apollo-server/blob/21651bd4ae00b5aade89831ab67a00e0e7094bd6/packages/apollo-server-core/src/types.ts#L53).

It's worth noting that the schema parameter forwarded to the executor will already contain all the resolvers under `schema._queryType._fields`. [graphql](https://www.npmjs.com/package/graphql) package starts the resolution of all fields: it invokes all of the resolvers you defined that are relevant for the query. The central [function](https://github.com/graphql/graphql-js/blob/278bde0a5cd71008452b555065f19dcd1160270a/src/execution/execute.js#L344) here is `executeOperation`. Eventually `resolveField` is called which does 2 things:

1. Resolves the top-level resolver via `resolveFieldValueOrError`.
2. Calls `completeValueCatchingError` which in its turn calls `completeValue` [which](https://github.com/graphql/graphql-js/blob/278bde0a5cd71008452b555065f19dcd1160270a/src/execution/execute.js#L802) recursively resolves the inner fields by calling their respective resolvers if any. Finally, the resulting data is returned to Apollo.

It's important to note that **resolver middleware** of the parent field is called before the resolvers of child fields as is the case of course with the resolvers themselves.

There're several ways of changing the resulting data before it is returned to the client, perhaps the easiest is by [using](https://www.apollographql.com/docs/apollo-server/api/apollo-server/) `formatResponse(result, ApolloCtx)` function in `ApolloServer` options.

> The important conclusion of what is described above is that you can't intercept the complete query result inside parent resolver middleware.

Consider this example, with the following schema for an app which allows users to make reviews and reply to the reviews (of course in reality there would be many more fields):

```graphql
type Review {
  id
  content
}

type Reply {
  id
  reviewId
  content
}
```

Suppose you define separate resolvers for `Review` and `Reply`. [prisma.io](https://www.prisma.io/) or [graphql-compose](https://graphql-compose.github.io/) can be used to provide such resolvers out of the box with support for sorting and filter arguments. Then, you would define a relation between `Review` and `Reply` so that you can query for all reviews populated with replies and sorted in ascending chronological order as follows:

```graphql
reviews(sort: ASCENDING_ORDER) {
    content
    replies {
        content
    }
}
```

Finally, suppose you need to re-order some elements: perhaps all reviews should be ordered chronologically, but the review with the most replies should be the one on top. The first impulse some may have (I certainly did! &#128578;) is to use some resolver middleware on `Review` resolver in order to receive all of the reviews, find the review with most replies and move it on top of resulting array. For example, this can be done like so:

```js
import { applyMiddleware } from "graphql-middleware"
const { ApolloServer } = require("apollo-server-express")
import { schema } from "./someSchema"
const reviewsMiddleware = {
  Query: {
    reviews: async (resolve, parent, args, context, info) => {
      const reviews = await resolve(parent, args, context, info)
      // perform custom logic
      return reviews
    },
  },
}

const server = new ApolloServer({
  schema: applyMiddleware(schema, userReviewsMiddleware),
  ...otherOptions,
})
```

But this won't work because there're 2 resolvers here: one for `Review` and another for `Reply` and child resolvers are called after parent resolvers (this is how GraphQL works). So when reviews resolver middleware is called reviews will not have the `replies` field resolved yet! Therefore you will not be able to perform custom logic on incomplete result. The proper way to do it would be to use `formatResponse` function which I mentioned above.

---

P.S.: in case you want to debug GraphQL internals you may find it useful to set `schema.polling.enable` to `false` in GraphQL playground in order to concentrate on debugging the query you're interested in and not be disturbed by automatic playground queries.
