---
title: "Accessing Parent Methods in Javascript Classes"
date: "2020-12-05T11:12:04.284Z"
description: "Accessing Parent Methods in Javascript Classes"
---

I recently got to do [Object-Oriented programming](https://en.wikipedia.org/wiki/Object-oriented_programming) in Javascript. Many of the Javascript features resemble Java language (`class`, `super`, `extends` and `static` keywords to name a few).

One of the differences with Java is that `super()` will not be called implicitly in child class so you must call it explicitly always when extending a class.

Another interesting issue I ran into is that if `super.someMethod()` is called from a child class, then `someMethod` **must not** be implemented as an arrow function. For example, the code below will trigger an error:

```js
class Car {
  drive = () => "drive"
}

class FastCar extends Car {
  drive = () => super.drive() + " fast"
}

const fastCar = new FastCar()
console.log(fastCar.drive())
```

The error is `TypeError: Cannot read property 'call' of undefined` will occur on the invocation of the line `console.log(fastCar.drive())`. The error occurs because the `drive` method in `Car` is implemented as an arrow function. As per this [stackoverflow answer](https://stackoverflow.com/questions/46869503/es6-arrow-functions-trigger-super-outside-of-function-or-class-error) a class method implemented as an arrow function become a property with function type while a method implemented as a regular function stays a class method. So while methods are stored in class prototype, properties are only accessible on class instances. Therefore the correct implementation is as follows:

```js
class Car {
  drive() {
    return "drive"
  }
}

class FastCar extends Car {
  drive = () => super.drive() + " fast"
}

const fastCar = new FastCar()
console.log(fastCar.drive())
```
