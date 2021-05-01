---
title: "How To Programmatically Get Javascript Objects Key Names Using Proxy API"
date: 2020-07-17T15:31:03.284Z
description: "How To Programmatically Get Javascript Objects Key Names Using Proxy API"
tags: "javascript, objects"
---

I find myself frequently iterating over some Javascript object keys and then performing specific actions which are relevant for some key. For example, imagine there's a website which aggregates various ratings of TV shows. The website wants to display all ratings of a particular show but the font size of IMDB rating should be 24 while all other ratings font size should be 16. Let's say the website uses [React.js](https://reactjs.org/) as their frontend framework:

```jsx
const theOffice = {
  imdbRating: 8.9,
  usersRating: 10,
  criticsRating: 7,
}

const Rating = ({ tvShow }) => (
  <>
    {Object.keys(tvShow).map(rating => (
      <div key={rating} style={{ fontSize: rating === "imdbRating" ? 24 : 16 }}>
        {rating} - {tvShow[rating]}
      </div>
    ))}
  </>
);

// The `Rating` component is used as follows:
<Rating tvShow={theOffice}> />
```

I personally don't like how `imdbRating` is a sting literal in the code (especially if there're dozens of keys and many of them require specific handling). So there're 2 conventional approaches:

1. Create a `constants` object which will contain all string literals used in the code.
2. Create another object where each key is the same as the original object key. Each key value provides data specific to the key for example returning the font size. Something like:

```js
const tvShowFieldsActions = {
    imdbRating: {
      fontSize: 24,
      // other details
    },
    usersRating: {
      fontSize: 16
    }
    criticsRating: {
      fontSize: 16,
    }
}
```

Both options are not great because they require creating additional objects, re-typing the keys of the original object and updating the additional objects every time the structure of the original object changes. If only there was a way to get an object's key name as a string programmatically...

Well, there's such a way indeed! Fortunately, Javascript has `Proxy` objects which can do exactly what I wanted.

> A [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) is created with two parameters: a target which is the original object which you want to proxy and the handler which is an object that defines which operations will be intercepted and how to redefine intercepted operations.

Let's see an example with the abovementioned `theOffice` object:

```js
const proxy = new Proxy(theOffice, {
  get: function(originalObject, objectKey) {
    return "That's what she said!"
  },
})

console.log("theOffice.imdbRating", theOffice.imdbRating) // logs 8.9
console.log("proxy.imdbRating", proxy.imdbRating) // logs "That's what she said!"
```

As you can see we've overridden the usual behavior of `theOffice` fields because when accessing `imdbRating` on the proxy object we're not receiving a number. However the original object continues to behave as usual, returning the actual rating.

Notice that the second parameter to the proxy get handler is `objectKey` which is none other than the key name. Therefore we can re-write the handler:

```js
const proxy = new Proxy(theOffice, {
  get: function(originalObject, objectKey) {
    return objectKey
  },
})

console.log(proxy.imdbRating) // logs "imdbRating"
```

Now we have a simple way to create a proxy object of the original and automatically get the names of each key by simply accessing it on the proxy object. Also if new fields are added to the original object the proxy object will be aware of that and still provide the names of new fields (that's why `Proxy` API can be used to create [observables](https://github.com/indiejs/structures)).

Finally the above example with `Rating` component can be updated:

```jsx
const theOffice = {
  imdbRating: 8.9,
  usersRating: 10,
  criticsRating: 7,
}

const proxy = new Proxy(theOffice, {
  get: function(originalObject, objectKey) {
    if (originalObject.hasOwnProperty(objectKey)) {
      return objectKey
    }
    throw new Error(`The field '${objectKey}' doesn't exist.`)
  },
})

const Rating = ({ tvShow }) => (
  <>
    {Object.keys(tvShow).map(rating => (
      <div
        key={rating}
        style={{ fontSize: rating === proxy.imdbRating ? 24 : 16 }}
      >
        {rating} - {tvShow[rating]}
      </div>
    ))}
  </>
)
```

I personally think it's a really cool way to dynamically retrieve object key names!
