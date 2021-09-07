---
title: "Javascript Regular Expressions Objects Gotchas"
date: 2020-09-25T10:39:03.284Z
description: "Javascript Regular Expressions Objects Gotchas"
tags: "javascript, regex"
excerpt: "I recently came across an interesting behavior when working with regular expressions (regex) in Javascript. I came across the following piece of code..."
---

I recently came across an interesting behavior when working with regular expressions (regex) in Javascript. I came across the following piece of code:

```js
const str = "food is great!"
const regex = /foo.*/g

console.log(regex.test(str)) // true
console.log(regex.exec(str)) // null
```

I was surprised that `regex.exec(str)` returns `null` because `regex.test(str)` returns `true`. After reading this [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec) reference I learned that Javascript regex objects with global or sticky flags are stateful. In particular they store `lastIndex` property:

```js
const str = "food is great!"
const regex = /foo.*/g

console.log(str.length) // 14
console.log(regex.test(str)) // true
console.log(regex.lastIndex) // 14
console.log(regex.exec(str)) // null
console.log(regex.lastIndex) // 0
console.log(regex.exec(str)) // ["food is great!"]
```

`lastIndex` specifies the index within the string at which to start the next match. The property is incremented (according to the rules described [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)) when `exec()` or `test()` methods are used. Therefore, when `regex.test(str)` is called `lastIndex` is set to `14` because there're no other matches for `/foo.*/g` within the string. When `regex.exec(str)` is executed it searches for match between `lastIndex` and the rest of the string which is an empty string by now and no match is found. After the last `exec()` call `lastIndex` is set to `0` therefore when `regex.exec(str)` is called again a match is found because the search now starts from the beginning of the string. This behavior is important to take into account because one may write the following code:

```js
const str = "food is great!"
const regex = /foo.*/g
if (regex.test(str)) {
  const match = regex.exec(str)
  // do something...
}
```

but the code will not work as expected due to the reasons described above. In such a case it will suffice to use a single call to `exec()`:

```js
const str = "food is great!"
const regex = /foo.*/g
const match = regex.exec(str)
if (match) {
  // do something...
}
```
