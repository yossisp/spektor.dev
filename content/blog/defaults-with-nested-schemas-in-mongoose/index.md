---
title: "How To Add Defaults In Mongoose Nested Schemas"
date: "2020-07-10T14:27:03.284Z"
description: "How To Add Defaults In Mongoose Nested Schemas"
---

Recently, I needed to update an existing [mongoose](https://mongoosejs.com/) schema (for those unfamiliar mongoose is a Javascript ORM for MongoDB) with a nested `rating` object. During the task I needed to define default values for nested mongoose schemas and update the existing documents with those which turned out a bit tricky. Read further for tips on how to do it.

The schema was for `Brand` object and already had a lot of fields. For the purposes of the article let's define the `Brand` schema like so:

```js
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const Brand = new Schema({
  meta: {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  contact: {
    email: String,
    address: String,
  },
})

module.exports = mongoose.model("Brand", Brand, "Brand")
```

The new `rating` object consisted of multiple sub-fields of objects. The lowest object level consisted of the fields `score` whose default value should be `0` and `maxScore` which can vary with each object field. Also the `rating` object is required. An intuitive implemention which doesn't implement defaults and mandatory fields might look like this:

```js
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const Brand = new Schema({
  meta: {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  contact: {
    email: String,
    address: String,
  },
  rating: {
    userExperience: {
      overall: {
        score: Number,
        maxScore: Number,
      },
    },
    independentReviews: {
      overall: {
        score: Number,
        maxScore: Number,
      },
    },
    overall: {
      score: Number,
      maxScore: Number,
    },
  },
})

module.exports = mongoose.model("Brand", Brand, "Brand")
```

As you can see the fields `score` and `maxScore` appear a lot in the schema so it will be easier to create a helper function `getRating` which receives a `maxScore` and returns an object with the relevant `score` and `maxScore` fields. In addition we'll create a new type called `BrandRating` so that we can mark it as required on `Brand` object:

```js
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const dbUrl = "mongodb://localhost:27017/local"

const main = async () => {
  mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    socketTimeoutMS: 3000000,
    keepAlive: 3000000,
    reconnectTries: 30,
    reconnectInterval: 10000,
  })

  const minScore = 0
  const getRating = ({ maxScore }) => ({
    type: new Schema(
      {
        score: {
          type: Number,
          min: minScore,
          max: maxScore,
        },
        maxScore: Number,
      },
      { _id: false }
    ),
    required: true,
    default: {
      score: minScore,
      maxScore,
    },
  })

  const BrandRating = new Schema(
    {
      userExperience: {
        overall: getRating({ maxScore: 50 }),
      },
      independentReviews: {
        overall: getRating({ maxScore: 50 }),
      },
      overall: getRating({ maxScore: 100 }),
    },
    { _id: false }
  )

  const Brand = new Schema({
    meta: {
      name: {
        type: String,
        required: true,
        unique: true,
      },
      slug: {
        type: String,
        required: true,
        unique: true,
      },
    },
    rating: {
      type: BrandRating,
      required: true,
      default: {},
    },
  })
  const BrandModel = mongoose.model("Brand", Brand, "Brand")
  const CurbYourEnthusiasm = new BrandModel({
    meta: {
      name: "Curb Your Enthusiasm",
      slug: "cye",
    },
    contact: {
      email: "cye@example.com",
      address: "California, USA",
    },
  })
  await CurbYourEnthusiasm.validate()
  await CurbYourEnthusiasm.save()
}

main().catch(error => console.error(error))
```

The code above can be run as is and will create a `CurbYourEnthusiasm` document complete with the `rating` object and all of the defaults. In case you already had a lot of documents and you just need to update them with the new rating system then it will just take a one-liner:

```js
await BrandModel.updateMany({}, { $set: { rating: {} } }).lean()
```

### A Few Side Notes:

- Setting the default for `rating` as empty object is crucial in order to enable creation of defaults. Without it default `score` values will not be created on nested schemas.
- Setting `_id: false` option is handy because id's are not needed on nested schemas because they're just an abstraction to enable validation (`required` fields) and default values.
- Calling `.lean()` on mongoose model methods is an optimization technique which return a plain Javascript object of the document instead of a mongoose object which has mongoose-specific metadata and internal state sometimes making the lean document [10 times](https://mongoosejs.com/docs/tutorials/lean.html) smaller than the mongoose object.
