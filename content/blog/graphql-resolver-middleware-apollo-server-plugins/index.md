---
title: "GraphQL Resolvers Middleware and Apollo Server Plugins"
date: 2020-04-04T11:58:03.284Z
description: "The post provides examples for possible GraphQL resolvers middleware and explains host to use Apollo Server plugins or extensions."
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

I recently came across a problem where I needed to perform some custom logic on the result of a GraphQL query before it's returned to the client and now I'd like to share some of the possible solutions in [Apollo Server](https://www.apollographql.com/docs/apollo-server/) and [graphql-compose](https://graphql-compose.github.io/).

It's important to understand whether resolver middleware can be used for the specific task or you will need Apollo Server-level middleware. Keep in mind that resolver middleware is run per resolver while some Apollo Server plugins will be run on the final result before it is sent back to the client. You can learn more on when resolver middleware will not be of help in my previous [post](https://spektor.dev/graphql-resolver-middleware-apollo-server-plugins/).

## Table of Contents

1. [Resolver middleware](#resolver_middleware)
2. [Response middleware in Apollo Server](#response_middleware)

### Resolver middleware: <a name="resolver_middleware"></a>

1. In graphql-compose you can [use](https://github.com/graphql-compose/graphql-compose-mongoose/blob/980044bcf481f9168ef5938ca0b5fb01abaca978/README.md) `wrapResolve` helper as follows:

```js
import { schemaComposer } from "graphql-compose"
schemaComposer.Query.addFields({
  someResolver: someResolverFunction.wrapResolve(next => async rp => {
    // do something before the result
    const result = await next(rp)
    // do something after the result
    return result
  }),
})
```

2. You can use `applyMiddleware` utility from [graphql-middleware](https://www.npmjs.com/package/graphql-middleware) from [Prisma Labs](https://www.prisma.io/) like so:

```js
import { applyMiddleware } from "graphql-middleware"
const { ApolloServer } = require("apollo-server-express")
import { schema } from "./someSchema"
const someMiddleware = {
  Query: {
    someResolver: async (resolve, parent, args, context, info) => {
      // do something before the result
      const result = await resolve(parent, args, context, info)
      // do something after the result
      return result
    },
  },
}

const server = new ApolloServer({
  schema: applyMiddleware(schema, userReviewsMiddleware),
  ...otherOptions,
})
```

3. `willResolveField` which comes from [graphql-extensions](https://github.com/apollographql/apollo-server/tree/master/packages/graphql-extensions). I couldn't find any documentation for this option but it exists. Better name for the extension would be `didResolveField` since it's called after the field was actually resolved. This is how you can enable it:

```js
const { ApolloServer } = require("apollo-server-express")
const server = new ApolloServer({
  extensions: [
    function middleware() {
      return {
        willResolveField(source, args, context, info) {
          return (error, result) => {
            if (error) {
              // do something
            }
            // do something
            return result
          }
        },
      }
    },
  ],
  ...otherOptions,
})
```

### Response middleware in Apollo Server: <a name="response_middleware"></a>

1. The easiest option which requires minimal configuration is `formatResponse` which can be enabled like so:

```js
const { ApolloServer } = require("apollo-server-express")
const server = new ApolloServer({
  formatResponse: (result, ctx) => {
    // do something
    return result
  },
  ...otherOptions,
})
```

2. Apollo uses [graphql-extensions](https://github.com/apollographql/apollo-server/tree/master/packages/graphql-extensions) package to allow us to hook into many stages of request execution via plugins. There's nice [documentation](https://www.apollographql.com/docs/apollo-server/integrations/plugins/) on this but some options are only mentioned [here](https://github.com/apollographql/apollo-server/blob/ef6e118e11edd51f702b9f74b0bd81142dc44549/packages/graphql-extensions/src/index.ts#L32). It's important to understand that request execution flow starts with `requestDidStart` so even if you're interested in other plugins you still must use `requestDidStart` to hook into the flow. Below is an example of `willSendResponse` where you can change the response:

```js
const { ApolloServer } = require("apollo-server-express")
const server = new ApolloServer({
  plugins: [
    {
      requestDidStart(request) {
        return {
          willSendResponse(result, context) {
            // do something
            return {
              graphqlResponse: result,
              context,
            }
          },
        }
      },
    },
  ],
  ...otherOptions,
})
```

In case you're using `willSendResponse` and `formatResponse` simultaneously it's worth noting that `formatResponse` is executed before `willSendResponse`.
