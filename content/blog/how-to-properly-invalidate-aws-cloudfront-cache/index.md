---
title: "How to Properly Invalidate Files Cached By AWS Cloudfont"
date: "2020-09-25T10:39:03.284Z"
description: "How to Properly Invalidate Files Cached By AWS Cloudfont"
---

<div style="display:flex;justify-content:center;padding-right:10%;padding-bottom:50px;padding-top:30px;">
    <img src="awslogo.svg"
            alt="Amazon Web Services Logo"
            style="margin:0;"
            />
</div>

Using CDN can greatly increase website load times and as a result user experience. [Cloudfront](https://aws.amazon.com/cloudfront/?nc=sn&loc=1) is a powerful CDN solution provided by Amazon Web Services (AWS). You can control origin requests cache by defining which routes (called behaviors in AWS) to cache and whether to cache headers, query parameters etc. And of course you can specify for how long to cache the requests. You can read more on how to set up a distribution and customize behaviors [here](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html).

Sometimes you will need to reset the cache on certain routes, for instance, after deployment. It is important to keep in mind that if you change the cache TTL setting in a specific behavior this [will not immediately](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/RemovingObjects.html) invalidate the cache.

The proper way to invalidate a specific route would be to use the `Invalidate` [option](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html) in the AWS console. This will immediately invalidate the files.

In addition I've found that if you have several behaviors, invalidating the default one (the root) will not invalidate a more specific route. For example, if you have 2 behaviors: `Default (*)` and `api/*` then in order to invalidate the second behavior you will need to enter `api/*` in the invalidate form.
