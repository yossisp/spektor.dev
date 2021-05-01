---
title: "How To Perform Multiple Aggregation Pipelines Within a Single Stage In MongoDB"
date: 2020-05-22T19:15:03.284Z
description: "How To Perform Multiple Aggregation Pipelines Within a Single Stage In MongoDB"
---

Recently, I had to add pagination feature to our website (our data resides in MongoDB). I wanted to define a single MongoDB aggregation pipeline which would fetch the required data (products) based on the criteria the user selects for the `n`-th page. But I also wanted the aggregation to return the total amount of products matched in the same aggregation. The last part turned out a bit tricky.

First, MongoDB aggregation pipeline stages work sort of like Unix "pipes": you do something in one stage and the next stage receives the output of the previous one. So let's say these are the stages needed to output the products:

```js
ProductCollection.aggregate([
  { $match: { score: { $gt: 0 } } },
  {
    $lookup: {
      from: "ProductSupplier",
      localField: "productSupplierId",
      foreignField: "_id",
      as: "productSupplier",
    },
  },
  {
    $sort: {
      price: 1,
    },
  },
  {
    $skip: offset,
  },
  {
    $limit: productsPerPage,
  },
])
```

`{ $count: 'totalCount' }` stage can be used to return the overall number of products. However, it can't be used anywhere within the pipeline because its result is simply (if the number of products is `4`):

```json
{ "totalCount": 4 }
```

which means all products data will be lost.

Fortunately, MongoDB provides an option to perform multiple pipelines within a single aggregation. It's called [\$facet](https://docs.mongodb.com/manual/reference/operator/aggregation/facet/). In `$facet` each child stage is run independently. This is exactly what I needed: 2 pipelines which are completely independent of each other:

```js
ProductCollection.aggregate([
  { $match: { score: { $gt: 0 } } },
  {
    $facet: {
      totalMatchedCount: [{ $count: "count" }],
      products: [
        {
          $lookup: {
            from: "ProductSupplier",
            localField: "productSupplierId",
            foreignField: "_id",
            as: "productSupplier",
          },
        },
        {
          $sort: {
            price: 1,
          },
        },
        {
          $skip: offset,
        },
        {
          $limit: productsPerPage,
        },
      ],
    },
  },
  {
    $unwind: "$totalMatchedCount",
  },
])
```

After such query the following result will be returned:

```js
{
  products: [
    // ... products
  ],
  totalMatchedCount: 100 // if 100 products were matched
}
```
