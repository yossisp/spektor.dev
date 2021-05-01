---
title: "Filtering Values In Nested Arrays In MongoDB"
date: 2020-12-25T14:27:03.284Z
description: "How To Filter Values In Nested Arrays In MongoDB"
tags: "mongodb"
---

Usually when you make queries in MongoDB, the returned result is the whole document with all the fields unless you make a projection. However, sometimes you may want to filter some field, specifically an array field by a certain condition. There're 3 options to achieve this:

1. [\$elemMatch](#elemMatch)
2. [\$filter](#filter)
3. [\$lookup with pipeline](#lookup)

## `$elemMatch` <a name="elemMatch"></a>

`$elemMatch` can be used in find operations. Suppose we have a collection named `UserReview` which contains reviews users made for a certain product and the documents also have a `replies` field which contains an array of comments made to a review. Each reply also has a `status` field which tells us whether a reply is approved or not to be displayed on the website. A document looks like so:

```js
{
      _id: 1,
      username: "John",
      content: "I liked the product",
      replies: [
        {
          username: "Andy",
          content: "I liked the product",
          status: "REJECTED"
        },
        {
          username: "Bob",
          content: "cool",
          status: "APPROVED"
        }
      ]
    }
```

If we want to find user reviews only with approved replies we can run the following query from MongoDB shell:

```js
db.UserReview.find({ "replies.status": "APPROVED" })
```

which will give us the following result:

```json
[
  {
    "_id": 1,
    "content": "I liked the product",
    "replies": [
      {
        "content": "I liked the product",
        "status": "REJECTED",
        "username": "Andy"
      },
      {
        "content": "cool",
        "status": "APPROVED",
        "username": "Bob"
      }
    ],
    "username": "John"
  }
]
```

As can be seen the `replies` field contains both approved and rejected replies because MongoDB returns the document with all the fields by default. If we want to see only approved replies we can use the following projection:

```js
db.UserReview.find(
  {
    "replies.status": "APPROVED",
  },
  {
    content: 1,
    username: 1,
    replies: {
      $elemMatch: {
        status: "APPROVED",
      },
    },
  }
)
```

This will return the following result:

```json
[
  {
    "_id": 1,
    "content": "I liked the product",
    "replies": [
      {
        "content": "cool",
        "status": "APPROVED",
        "username": "Bob"
      }
    ],
    "username": "John"
  }
]
```

You can check out the query and play with it in this [playground](https://mongoplayground.net/p/ZYRudaLv5h6).

## `$filter` <a name="filter"></a>

In aggregation pipeline `$filter` can be used. Given the same document as above the aggregation would be as follows:

```js
db.UserReview.aggregate([
  {
    $match: {
      "replies.status": "APPROVED",
    },
  },
  {
    $project: {
      username: 1,
      content: 1,
      replies: {
        $filter: {
          input: "$replies",
          as: "reply",
          cond: {
            $in: ["$$reply.status", ["APPROVED"]],
          },
        },
      },
    },
  },
])
```

In `$filter` operation a temporary internal variable `reply` is created on which conditional operator `cond` is invoked. `$$reply.status` is prefixed with `$$` in order to refer to the temporary variable. You can play with the aggregation [here](https://mongoplayground.net/p/ljWhbenpOb8).

I personally prefer to use `$addFields` stage in this case because it allows to overwrite the original `replies` field. This way other user review fields like `content` and `username` do not need to be explicitly specified in projection:

```js
db.UserReview.aggregate([
  {
    $match: {
      "replies.status": "APPROVED",
    },
  },
  {
    $addFields: {
      replies: {
        $filter: {
          input: "$replies",
          as: "reply",
          cond: {
            $in: ["$$reply.status", ["APPROVED"]],
          },
        },
      },
    },
  },
])
```

## `$lookup` with pipeline <a name="lookup"></a>

It's worth mentioning that in a real life scenario user reviews and user replies may be stored in separate collections, therefore a `$lookup` stage will be required. In such case a special case of lookup can be used which uses `pipeline` [operation](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/index.html#join-conditions-and-uncorrelated-sub-queries).

Suppose the `UserReview` collections has the following document:

```js
    {
      _id: 1,
      username: "John",
      content: "I liked the product"
    }
```

while the `UserReply` has the follwing documents:

```js
    {
      _id: 11,
      username: "Andy",
      content: "I liked the product",
      userReviewId: 1,
      status: "REJECTED"
    },
    {
      _id: 12,
      username: "Bob",
      content: "cool",
      userReviewId: 1,
      status: "APPROVED"
    }
```

In such case the following aggregation can be performed ([playground](https://mongoplayground.net/p/73CYI8Hw136)):

```js
db.UserReview.aggregate([
  {
    $lookup: {
      from: "UserReply",
      let: {
        id: "$_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$$id", "$userReviewId"],
            },
            status: "APPROVED",
          },
        },
      ],
      as: "replies",
    },
  },
])
```

Because only approved replies are matched within the lookup pipeline the join includes only approved replies in the first place, so no filtering is necessary. Thus the result would be:

```json
[
  {
    "_id": 1,
    "content": "I liked the product",
    "replies": [
      {
        "_id": 12,
        "content": "cool",
        "status": "APPROVED",
        "userReviewId": 1,
        "username": "Bob"
      }
    ],
    "username": "John"
  }
]
```

However, if the aggregation were:

```js
db.UserReview.aggregate([
  {
    $lookup: {
      from: "UserReply",
      localField: "_id",
      foreignField: "userReviewId",
      as: "replies",
    },
  },
  {
    $match: {
      "replies.status": "APPROVED",
    },
  },
])
```

a user review would be matched with all the replies where `userReviewId` equals to the `_id` of the user review and the `replies` field contains at least 1 approved reply. In such case `$filter` would need to be used in projection stage.
