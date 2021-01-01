---
title: "Tech Articles I Really Liked"
date: "2021-01-01T19:37:03.284Z"
description: "The Tech Articles I Really Liked"
---

Every once in a while I come across I really great tech article or video which offers great insights, sheds light on obscure matters or simply made a big impression on me. I'd like to share such articles/videos below with a brief summary (I will be updating the list occasionally).

### Inventing On Principle by Bret Victor

His [lecture](http://worrydream.com/#!/InventingOnPrinciple) made a profound impression on me. Bret, who is a former human interface researcher at Apple, talks about just how important it is to have interactive tools when creating and to be able to explore when developing new features.

### REST is the new SOAP by Pakal de Bonchamp

This [article](https://www.freecodecamp.org/news/rest-is-the-new-soap-97ff6c09896d/) showcases all the drawbacks and missed goals of REST architecture. Pakal argues REST implementation varies from organization to organization, there's no set standard and sometimes its semantics are misleading and unintuitive. It involves quite a lot of boilerplate and as a result requires more time in order to develop API then [RPC](https://en.wikipedia.org/wiki/Remote_procedure_call) technologies, for example. Indeed, I hear about [gRPC](https://grpc.io/about/) more and more lately (I hope to check it out in one of my projects soon 🙂). In addition, there's GraphQL which a direct competitor to REST. GraphQL is a very interesting technology which I've been working with for more than a year now. It has some great features (playground, type system, ability to select only the necessary data). I do feel it has some drawbacks as well though:

- requests are POST by default which means no CDN cache out of the box and that you will need to spend some extra effort to [convert](https://www.apollographql.com/docs/apollo-server/performance/apq/) your queries to GET requests.
- even errors return with 200 code which can be a nuissance.
- for large datasets all that type validation and checking can be a heavy penalty on [response time](https://github.com/graphql/graphql-js/issues/723).
