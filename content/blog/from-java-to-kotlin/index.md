---
title: "Why Kotlin Makes Developers Happy"
date: 2023-02-25T20:19:03.284Z
description: "Learn about Kotlin main features and why it makes sense to switch from Java to Kotlin."
tags: "kotlin, java, productivity"
excerpt: Kotlin is a modern language which tries to simplify common actions which usually result in a lot of Java boilerplate. Its approach to concurrency is a breath of fresh air...
---

<div style="display:flex;justify-content:center;padding-right:10%;padding-bottom:50px;padding-top:30px;">
    <img src="kotlin_logo.svg"
    alt="Kotlin Logo"
    style="margin:0;"
    />
</div>

1. [What Is Kotlin?](#what-is-kotlin)
2. [Productivity and Developer Experience](#productivity)
    1. [Null Safety](#null-safety)
    2. [Elvis Operator](#elvis-operator)
    3. [String Interpolation](#string-interpolation)
    4. [Destructuring](#destructuring)
    5. [Method Default Arguments](#method-default-arguments)
    6. [Named Method Arguments](#named-default-arguments)
    7. [Automatic Initialization of Class Properties](#automatic-class-props-init)
    8. [Copy Function](#copy-function)
    9. [Extensions](#extensions)
    10. [Type Aliases](#type-aliases)
    11. [Readable Test Names](#readable-test-names)
    12. [Simple Builder Pattern Implemention](#simple-builder-pattern-implementation)
3. [Concurrency](#concurrency)
4. [Bonus](#bonus)

### <a name="what-is-kotlin"></a>What Is Kotlin?

[Kotlin](https://kotlinlang.org) is a JVM-based language developed by [JetBrains](https://www.jetbrains.com/).
According to JetBrains it's:
>A modern programming language that makes developers happier.

#### Fun facts:
- Open source.
- Recommended by Google for building Android apps (Android mobile development has been Kotlin-first since Google I/O in 2019).
- At the time of the writing there're 84k Stackoverflow questions tags with Kotlin vs 67k Golang vs 1.8 mil Java.
- First-class support since Spring 5 (choose Kotlin as the language in the [Spring initilizer](https://start.spring.io/)).
- Full interoperability with Java: call Kotlin code from Java files and vice versa.
- Compiling Kotlin to Java bytecode is very easy: just add Kotlin compiler plugin (via Maven or Gradle).
- Compiles to Java 8 compatible bytecode by [default](https://kotlinlang.org/docs/faq.html#which-versions-of-jvm-does-kotlin-target).

#### Uses:
- For developing Android applications.
- For developing serverside applications.
- [Scripting](https://kotlinlang.org/docs/command-line.html#run-scripts).
- [Data science](https://kotlinlang.org/docs/data-science-overview.html) e.g. [Jupyter Notebooks](https://kotlinlang.org/docs/data-science-overview.html#jupyter-kotlin-kernel).

Overall, Kotlin is a modern language which tries to simplify common actions which usually result in a lot of Java boilerplate.
Its approach to concurrency is a breath of fresh air compared to Java `CompletableFuture`. Below I'll showcase the main features which in my opinion make Kotlin a game-changer in terms of productivity, developer experience and concurrency.

### <a name="productivity"></a>Productivity and Developer Experience
#### <a name="null-safety"></a>Null Safety
In Kotlin null safety in built into the language. A variable must be declared as nullable or non-nullable:
```kotlin
var nullableStr: String? = null
var nonNullableStr: String = "abc"
```

When a method is invoked on a nullable variable, safe call operator (`?`) is used as opposed to the verbose `Optional` in Java:
```kotlin
println(nullableStr?.length)
```
which will return the string length if the string is not null or `null` otherwise. Imagine an object which has a hierarchy of at least 2 levels of nullable fields. In Kotlin you could check for nullness as easily as `myObject?.fieldA?.fieldB == null` as opposed to multiple `Optional`s in Java.

#### <a name="elvis-operator"></a>Elvis Operator
A default value can be provided in case a variable is null as follows:
```kotlin
var nullableStr: String? = null
println(nullableStr ?: "default str")
```
A default value can even be an exception:
```kotlin
val result = getResult() ?: throw RuntimeException("could not get a result")
```

#### <a name="string-interpolation"></a>String Interpolation
```kotlin
val name = "Paul"
val lastName = "McCartney"
println("Full name: $name $lastName")
```
#### <a name="destructuring"></a>Destructuring
Another handy feature which will look familiar to Javascript users:
```kotlin
data class Person(val name: String, val lastName: String)
val musician = Person("Mark", "Knopfler")
val (name, lastName) = musician
println("Full name: $name $lastName")
```
Here, after defining a `Person` class we extract its fields using destructuring. Values from arrays can be extracted in a similar fashion:
```kotlin
val lotteryNumbers = listOf(42, 7, 5)
val (firstNum) = lotteryNumbers
println("first number: $firstNum")
```

#### <a name="method-default-arguments"></a>Method Default Arguments
Kotlin allows to provide default arguments to a method:
```kotlin
fun read(
    permissions: String,
    fileName: String = "/home/default-file"
) {}
```
In this example, the default value for `fileName` argument is `"/home/default-file"`.

#### <a name="named-default-arguments"></a>Named Method Arguments
When calling a method we can refer to its arguments by their name:
```kotlin
fun read(
permissions: String,
fileName: String = "/home/default-file"
) {}

read(permissions = "rw", fileName = "./data") // use arguments by name
read("rw", "./data") // don't use arguments by name
```
This feature may be handy if your method receives several arguments of the same type to prevent supplying value for argument `x` to argument `y` by mistake.

#### <a name="automatic-class-props-init"></a>Automatic Initialization of Class Properties
Class fields are automatically initialized for primary constructors:
```kotlin
class Person(val name: String, val lastName: String) {

}

fun main() {
    val billy = Person("Billy", "Joel")
    println(billy.name)
}
```

#### <a name="copy-function"></a>Copy Function
Traditionally, in Java copy constructor needs to be defined in order to copy an object instance. In Kotlin each class has a built-in `copy()` method which copies fields (references are shallow cloned):
```kotlin
data class Person(val name: String, val lastName: String)
val musician = Person("Kurt", "Cobain")
val anotherMusician = musician.copy()

println(musician.equals(anotherMusician))
println(musician === anotherMusician)
```
The first `println` prints `true` since the objects values are the same. The second `println` prints `false` since the references of the objects are not the same.

#### <a name="extensions"></a>extensions
It's very common to have a util class which has a bunch of static helper methods. Kotlin allows to define extension functions on a class and then invoke the function directly on an object instance.
Below an extension function `isUrl()` is defined on `String` class:
```kotlin
import java.net.URL
import java.net.MalformedURLException

// Checks if a string is a valid URL
fun String.isUrl(): Boolean {
    var isUrl = false

    try {
        URL(this)
        isUrl = true
    } catch (exception: MalformedURLException) {

    }
    return isUrl
}

fun main() {
    val maybeUrl = "https://www.google.com"
    println(maybeUrl.isUrl())
}
```

#### <a name="type-aliases"></a>Type Aliases
Aliases can be defined for classes. This is useful when the object type is either verbose or an alias can better describe it:
```kotlin
// key - restaurant name
// value - pair: left - user rating, right - restaurant critic rating
typealias RestaurantRatings = MutableMap<String, Pair<Int, Int>>

typealias UrlStr = String

fun buildRatings(): RestaurantRatings {
    val map = mutableMapOf<String, Pair<Int, Int>>()
    map.put("Nono-Mimi", Pair(5, 4))
    return map
}

fun makeRequest(address: UrlStr, accessToken: String) {
 // do something
}

fun main() {
    val ratings: RestaurantRatings = buildRatings()
    println(ratings)

    makeRequest("http://google.com", "token")
}
```
In this example using `RestaurantRatings` alias better describes the type and we don't have to type out `MutableMap<String, Pair<Int, Int>>` each time.
Also `UrlStr` better describes a URL than simply a string.

#### <a name="readable-test-names"></a>Readable Test Names
Functions in Kotlin can have space characters. This allows to give descriptive names to test functions instead of using `@DisplayName` as in JUnit for example:
```kotlin
class PersonTest {

    @Test
    fun `person is successfully created`() {

    }
}
```

#### <a name="simple-builder-pattern-implementation"></a>Simple Builder Pattern Implemention
[Builder pattern](https://www.digitalocean.com/community/tutorials/builder-design-pattern-in-java) is a very popular design pattern in Java
however it's notoriously verbose: same fields, getters/setters needs to declared twice, first in the target class, secondly in the builder class.
The implementation of the pattern in Kotlin is much more [concise](https://www.baeldung.com/kotlin/builder-pattern#kotlin-style):
```kotlin
class FoodOrder private constructor(
val bread: String?,
val condiments: String?,
val meat: String?,
val fish: String?) {

    data class Builder(
    var bread: String? = null,
    var condiments: String? = null,
    var meat: String? = null,
    var fish: String? = null) {

        fun bread(bread: String) = apply { this.bread = bread }
        fun condiments(condiments: String) = apply { this.condiments = condiments }
        fun meat(meat: String) = apply { this.meat = meat }
        fun fish(fish: String) = apply { this.fish = fish }
        fun build() = FoodOrder(bread, condiments, meat, fish)
    }
}

fun main() {
    val foodOrder = FoodOrder.Builder()
    .bread("white bread")
    .meat("bacon")
    .condiments("olive oil")
    .build()

    println(foodOrder.bread)
}
```

### <a name="concurrency"></a>Concurrency
Kotlin concurrency model is based on the concept of [communicating sequential processes](https://en.wikipedia.org/wiki/Communicating_sequential_processes#:~:text=In%20computer%20science%2C%20communicating%20sequential,on%20message%20passing%20via%20channels.) (CSP) introduced by Tony Hoare.
It uses channels and coroutines (like Go). The motto is:
>Do not communicate by sharing memory; instead, share memory by communicating.

Kotlin uses coroutines which are light-weight threads as well as [structured concurrency](https://kotlinlang.org/docs/coroutines-basics.html#structured-concurrency):
>An outer scope cannot complete until all its children coroutines complete. Structured concurrency also ensures that any errors in the code are properly reported and are never lost.

Coroutines are created by adding `suspend` keyword before a function definition. Coroutines are not part of the language but rather are implemnted in `kotlinx.coroutines` package which can be imported as a [dependency](https://mvnrepository.com/artifact/org.jetbrains.kotlinx/kotlinx-coroutines-core).

#### Coroutines Are Executed Sequentially
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlin.system.measureTimeMillis

suspend fun doSomethingUsefulOne(): Int {
    delay(1000L) // pretend we are doing something useful here
    println("doSomethingUsefulOne")
    return 13
}

suspend fun doSomethingUsefulTwo(): Int {
    delay(5000L) // pretend we are doing something useful here, too
    println("doSomethingUsefulTwo")
    return 29
}

// coroutines are executed sequentially
suspend fun sequentialSum() {
    doSomethingUsefulOne()
    doSomethingUsefulTwo()
    println("done")
}

fun demoCoroutines() {
    runBlocking {
        sequentialSum()
    }
}

fun main() {
    demoCoroutines()
}
```
In the example below first `doSomethingUsefulOne()` is executed then `doSomethingUsefulTwo()` is. Please note the simplicity of use, there's no awaiting!
In case functions don't depend on each other they can be executed concurrently:
```kotlin
suspend fun concurrentSum() = coroutineScope {
    val one = async { doSomethingUsefulOne() }
    val two = async { doSomethingUsefulTwo() }
    println("The answer is ${one.await() + two.await()}")
}
```
`await()` is used in order to wait for the result of both functions. Try/catch can be used for error handling. This is in stark contract to Java `CompletableFuture` where `handlyAsync` would have to be used not to mention the family of `thenXXX()` functions like `thenApply()` etc. which break normal coding flow.

Executing coroutines concurrently and awaiting their result is easy:
```kotlin
suspend fun asyncLoop() = coroutineScope {
    val asyncResults = (0..100).map {
        async {
            delay(1000L)
            println("asyncLoop iteration number: $it")
        }
    }
    asyncResults.awaitAll()
}
```

Another great concurrency feature of Kotlin is channels (will look familiar to Golang users). Channels are great for implementing consumer/producer patterns as well as to prevent synchronization issues with shared state.
For example, let's take a look at the example below:
```kotlin
suspend fun channelSharedStateDemoBad() {
    var counter = 0
    withContext(Dispatchers.Default) {
        val n = 10000  // number of coroutines to launch
        val time = measureTimeMillis {
            coroutineScope { // scope for coroutines
                repeat(n) {
                    async {
                        counter++
                    }
                }
            }
        }
        println("Completed $n actions in $time ms")
    }
    println("Counter = $counter")
}
```
`counter` which is shared state among coroutines is modified concurrently without being synchronized which almost surely will result in incorrect count at the end.
On the other hand using channels doesn't require synchronization because channel throughput is one message by default so only one consumer can process a message at a time.
```kotlin
suspend fun channelSharedStateDemoGood() = coroutineScope {
    var counter = 0
    val upperBound = 10000
    val sumChannel = Channel<Int>()
        (1..upperBound).map {
            async {
                println(it)
                sumChannel.send(1)
            }
        }
        repeat(upperBound) {
            val number = sumChannel.receive()
            counter += number

        }
        println("counter: $counter")
    }
```

### <a name="bonus"></a>Bonus
1. Official Kotlin [playground](https://play.kotlinlang.org/).
2. When copying Java code into a Kotlin file IntelliJ will automatically convert a Java code to Kotlin.
3. A great article [_What Color is Your Function?_](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) comparing concurrency implementation in different languages.