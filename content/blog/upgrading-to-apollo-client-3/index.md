---
title: "Upgrading From Apollo Boost to Apollo Client 3"
date: "2020-08-28T11:41:03.284Z"
description: "Upgrading From Apollo Boost to Apollo Client 3"
---

![apollo logo](./apollo.png)

I've been using [Apollo Client/Server](https://www.apollographql.com/docs/) for a while and although these are great projects I did experience inconsistencies and issues with the client cache/local state. So much so that I was thinking of migrating to another local state solution. However Apollo Client 3 came out recently which significantly revamped local state functionality and claims to have fixed the earlier issues. So I decided to upgrade to it from using the older Apollo Boost.

The new client provides all of the functionality that Apollo Boost used to provide so the Boost project is now retired. The Apollo team posted a really nice [guide](https://www.apollographql.com/docs/react/migrating/apollo-client-3-migration/) on how to upgrade to the new client which is really helpful. Below are some of the steps I had to take in order to complete the migration in addition to the ones described in the guide:

1. We were using [next-will-apollo](https://www.npmjs.com/package/next-with-apollo) with Apollo Boost. It's a nice library which calls [getDataFromTree](https://www.apollographql.com/docs/react/api/react/ssr/#getdatafromtree) Apollo function which determines which queries need to be run for render and fetches them. However, using this library with Apollo Client 3 resulted in this [error](https://github.com/apollographql/apollo-client/issues/5808): `Module not found: Can't resolve 'apollo-client' in 'node_modules/@apollo/react-hooks/lib'`. Upgrading `next-will-apollo` to the latest version solved the issue. However, in the latest version of `next-will-apollo` you need to explicitly pass `getDataFromTree` like so:

```js
import withApollo from 'next-with-apollo';
import { getDataFromTree } from '@apollo/react-ssr';

export default withApollo({ ctx, headers, initialState }) {
  return new ApolloClient({
    // ... options
  })
}, { getDataFromTree });
```

2. For me personally, by far the most work involved in the upgrade was caused by the fact that the cache results are immutable. For example, performing a `sort` on such results will cause a run-time error because native Javascript `sort` method sorts in-place thus mutating the original array.

3. Apollo Client 3 introduced a really nice feature called [reactive variables](https://www.apollographql.com/docs/react/local-state/reactive-variables/). From now on, you don't need to write custom client resolvers in order to read/write local state values, just use reactive variables to create them as simply as:

```js
import { makeVar } from "@apollo/client"
const isLoggedIn = makeVar(false)
```

You can then use the `isLoggedIn` function anywhere in code in order to either get the value: `const isLoggedIn = isLoggedIn()` or to set the value `isLoggedIn(true)`

It's important to reset reactive variables to their initial values if you reset the client store because their values are not reset automatically:

```js
import withApollo from 'next-with-apollo';
import { getDataFromTree } from '@apollo/react-ssr';

export default withApollo({ ctx, headers, initialState }) {
  const client = new ApolloClient({
    // ... options
  })
  client.onResetStore(() => {
    // reset reactive variables here...
  });
  return client
}, { getDataFromTree });
```

Lastly, make sure to pay attention to the [breaking changes](https://www.apollographql.com/docs/react/migrating/apollo-client-3-migration/#breaking-cache-changes) involved in the upgrade.
