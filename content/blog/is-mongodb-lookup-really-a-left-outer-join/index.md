---
title: "Is MongoDB $lookup Really a Left Outer Join?"
date: "2021-01-05T21:31:03.284Z"
description: "MongoDB $lookup Join Behavior (With $unwind)"
---

I had a case recently where I ran a [`$lookup`](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/#lookup-join-pipeline) stage in MongoDB aggregation. I had 2 collections: one which contains products (Product) and one which contains availability regions (Region). Each product may be available in certain regions, therefore Product documents have `regions` field which contains an array of regions the product is available in, for example:

```js
{
    _id: 1,
    name: "Great Product",
    regions: [
        11,
        12
    ]
}
```

where each element in the `regions` array is an ObjectID of a Region document. In my aggregation I needed to return regions with their product. This can be done with a `$lookup` like so:

```js
db.Region.aggregate([
  {
    $lookup: {
      from: "Product",
      let: {
        id: "$_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ["$$id", "$regions"],
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
          },
        },
      ],
      as: "product",
    },
  },
  {
    $unwind: "$product",
  },
])
```

This worked but the results contained only the regions which were assigned a product. I visited MongoDB [documentation](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/index.html#join-conditions-and-uncorrelated-sub-queries) on `$lookup` stage which clearly states that `$lookup`:

> Performs a **left outer join** to an unsharded collection in the same database to filter in documents from the “joined” collection for processing.

Translating SQL terminology into "MongoDB speak" we get that even regions which don't have a product assigned should be added in the result. So I decided to investigate the `$unwind` stage. Interestingly enough, it turns out that `$unwind` has `preserveNullAndEmptyArrays` [parameter](https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/#unwind-preservenullandemptyarrays): if `preserveNullAndEmptyArrays` is false (which is the default value) and the looked up document is null, missing, or an empty array then `$unwind` does not output a document! This is the very reason which caused me to believe that `$lookup` was performing a left inner join. The following query sets the `preserveNullAndEmptyArrays` to true which returns even regions without a product:

```js
db.Region.aggregate([
  {
    $lookup: {
      from: "Product",
      let: {
        id: "$_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ["$$id", "$regions"],
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
          },
        },
      ],
      as: "product",
    },
  },
  {
    $unwind: {
      path: "$product",
      preserveNullAndEmptyArrays: true,
    },
  },
])
```

You can play with the query in the [playground](https://mongoplayground.net/p/eoO_nxRpxkP) as well.
