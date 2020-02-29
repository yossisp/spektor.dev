---
title: "The King of All Bugs: Cookie-based Authentication + Apollo React Client Results in SSL Handshake Failure"
date: "2020-02-29T19:19:03.284Z"
description: "TL;DR: handle host header with care."
---

I recently was given a task to add user authentication to our website. It was decided to implement the authentication logic using [httpOnly](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) cookie. Client-side the browser will take care of passing the cookie of course so the only thing left was to pass the cookie header server-side. Headers can be passed to Apollo client in the [constructor](https://github.com/apollographql/apollo-client/blob/master/src/ApolloClient.ts#L40). The diagram below displays our technology stack:

![our technology stack](./stackDiagram.png)

`next-with-apollo` is a handy npm [package](https://www.npmjs.com/package/next-with-apollo) which makes headers available from [Express.js](https://expressjs.com) (which serves server-side pages), thus:

```jsx
import withApollo from "next-with-apollo"
import ApolloClient, { InMemoryCache } from "apollo-boost"
import renderFn from "./render"

export default withApollo(
  ({ initialState, headers }) => {
    return new ApolloClient({
      uri: "https://mysite.com/graphql",
      headers, // <- headers are passed here
    })
  },
  {
    render: renderFn,
  }
)
```

At this point point I was quite happy and went for a break to practice my [Yo-Yo](https://www.youtube.com/watch?v=-wiNh4LLQzg) skills (Yo-Yo-ing has become trendy in our office).

I returned to my work station in order to finish the task: polish the server logic which handles authentication. Eventually I was done.

> Everything worked perfectly in the development environment.

I had another Yo-Yo practice. The only thing left was to deploy the logic to our staging environment. When I checked the website after deployment there was an error:

> ApolloError: Network error: request to https://example.com/graphql/ failed, reason: write EPROTO 140152723232576:error:14094410:SSL routines:ssl3_read_bytes:sslv3 alert handshake failure:../deps/openssl/openssl/ssl/record/rec_layer_s3.c:1544:SSL alert number 40

Since I added a lot of logic in the task including [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), cookies and a bunch of graphql resolvers I had to minimize the number of possible causes of bugs.

At first I suspected that CORS is culprit, that somehow it blocks browser requests. This was not the case however. After removing authentication logic piece by piece in order to identify the problem I discovered the issue was passing headers to the Apollo client as can be seen in the code excerpt above, specifically the `host` header which was something like `bla.bla.bla.elasticbeanstalk.com`.

"But what does that have to do with the SSL handshake error?", you ask. Well, it turns out that `host` header is quite important and is used in Server Name Indication ([SNI](https://en.wikipedia.org/wiki/Server_Name_Indication)) extension to TLS protocol. Here's the gist:

> Since issuing SSL certificate per dedicated IP address is [expensive](https://aws.amazon.com/cloudfront/custom-ssl-domains/) you need to somehow tell the server which resource you're interested in. The trick is though that before any communication between the client and server starts, SSL handshake must be made. But how does one make the SSL handshake if the resource is not yet known and the server doesn't know which certificate to send? This is where SNI comes in: the mechanism was added in order to tell the server which virtual domain to serve. SNI relies on the `host` header to tell the server which domain to serve. Since my `host` header contained Elastic Beanstalk domain SSL handshake failed because we were using AWS for deployment which uses SNI.

In order to fix the bug I [found out](https://github.com/lfades/next-with-apollo/issues/88#issuecomment-570010727) that you can simply pass only the header you need in Apollo client constructor, so I only passed the cookie header:

```jsx
import withApollo from "next-with-apollo"
import ApolloClient, { InMemoryCache } from "apollo-boost"
import renderFn from "./render"

export default withApollo(
  ({ initialState, headers }) => {
    return new ApolloClient({
      uri: "https://mysite.com/graphql",
      headers: {
        cookie: headers?.cookie,
      },
    })
  },
  {
    render: renderFn,
  }
)
```

In case you're wondering how the question mark in this line `cookie: headers?.cookie` is valid Javascript check out the [optional chaining](https://www.npmjs.com/package/babel-plugin-transform-optional-chaining) Babel.js plugin, it's awesome!
