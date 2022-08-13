---
title: "How To Access and Handle Java Exceptions Using Spring Aspect-Oriented Programming"
date: 2022-08-13T21:19:03.284Z
description: "How To Access Java Exceptions Using Spring AOP, how to handle Java Exceptions, how to catch Java Exceptions, how to centrally access Java exceptions, how to execute custom logic on each Java exception"
tags: "java, exception-handling, aop, spring-aop"
excerpt: "In software engineering often times certain logic needs to be applied in multiple modules of an application..."
---
![Spring Framework Logo](./spring-logo.svg)

1. [Why Aspect-Oriented Programming?](#motivation)
2. [Aspect-Oriented Programming Basics](#aop-basics)
3. [How Spring AOP Works](#how-it-works)
4. [Exception Handling Implementations Using Spring AOP](#implementations)

<h3 name="motivation">Why Aspect-Oriented Programming (AOP)?</h3> 

In software engineering often times certain logic needs to be applied in multiple modules of an application, e.g. making client requests to a server, database access etc. In object-oriented programming classes are usually used to encapsulate such logic. For example, an `ApiClient` class which multiple modules of an application would use in order to make requests to some API service.

That being said some application logic may be used so extensively that it becomes extremely repetetive to use such logic each time. Suppose we want to log with debug level the name of each method, its arguments and the return value. We could manually write such code for each and every method but there're a few disadvantages with this approach:

1. A lot of manual, tedious work.
2. One can forget to log some method.
3. Code becomes harder to read.
4. Time-consuming refactors: say message format needs to be changed then the change needs to be performed across all occurrences.

Such ubiquitous logic which is scattered all over the application is an example of a **cross-cutting concern**: it literally cuts across almost every part of the application. Examples of cross-cutting concerns include logging, exception handling, recording application metrics, tracing etc. [Aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming) aims to tackle these issues.

Several implementations of aspect-oriented programming are available for Java where [AspectJ](https://www.eclipse.org/aspectj/) is the de-facto standard. In addition Java Spring framework [provides](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop) a subset of AspectJ features. In this tutorial I will describe several strategies to access and handle Java exceptions using aspect-oriented prpgramming. This can be handy if exception handling involves repetetive tasks like sending an error metric on each exception or executing other custom exception related logic. If you just want to get error metrics on each exception you may also be interested in Spring actuator [Logback metrics](https://docs.spring.io/spring-boot/docs/2.0.x/reference/html/production-ready-metrics.html#production-ready-metrics-meter). This metric will not include the actual type of exception though.

<h3 name="aop-basics">Aspect-Oriented Programming Basics</h3>

AOP and AspectJ deserve comprehensive study in their own right hence I will give a very brief introduction into the main concepts:

- **Aspect**: logic which cuts across multiple parts of an application (exception handling in our case). Fun fact: transaction management (`@Transactional`) is implemented using AOP in Spring.
- **Join point**: a point during application execution when a cross-cutting concern occurs e.g. method execution, accessing a class field. **Spring AOP only allows method execution join points**.
- **Advice**: dictates when aspect logic is invoked e.g. before method execution, after etc.
- **Pointcut**: a logical condition which needs to be matched so that an aspect is executed. For example, we may want to execute certain logic only for methods of Java package `services`.

<h3 name="how-it-works">How Spring AOP Works</h3> 

To summarize the above Spring AOP can intercept method execution before/after etc. the actual execution. You can also tell it which methods to intercept and what to do following the intercept. How does Spring AOP actually intercept method execution? It does it **at runtime** using [two options](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop-introduction-proxies):

1. Native JDK dynamic proxies if the intercepted method belongs to a class which implements an interface.
2. CGLIB in all other cases.

It's important to understand the implications of proxies usage (this should already be familiar to anyone using `@Transactional` annotation in Spring):

1. Only public methods can be intercepted.
2. Method which is called by another method of the same class will not be intercepted.

You can read more about Spring AOP proxies [here](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop-understanding-aop-proxies). In addition Spring AOP components are regular Spring beans and are annotated with `@Aspect` + `@Component`, `@Service` etc. **This means that aspects can't be applied to classes which are not Spring beans.**

To [enable](https://docs.spring.io/spring-framework/docs/4.3.15.RELEASE/spring-framework-reference/html/aop.html#aop-enable-aspectj-xml) `@AspectJ` support with Java `@Configuration` add the `@EnableAspectJAutoProxy` annotation. Lastly, make sure that `org.aspectj:aspectjweaver` is on the class path (Maven central [link](https://mvnrepository.com/artifact/org.aspectj/aspectjweaver)).

<h3 name="implementations">Exception Handling Implementations Using Spring AOP</h3> 

The simplest way to access exceptions is to use after throwing advice. Each time a method exits because an exception was thrown the aspect will be invoked. An important caveat to this advice is that if `try/catch` is used the aspect will not be invoked (because the method didn't exit):

```java
package com.myapp.mypackage;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ExceptionHandlingAspect {

	@Pointcut("within(com.myapp..*) && execution(* *(..))")
	public void matchAllMyMethods() {}

	@AfterThrowing(value = "matchAllMyMethods()", throwing = "exception")
	public void doSomethingWithException(JoinPoint joinPoint, Throwable exception) {
		// get access to the actual exception thrown
		System.out.println(exception);

        // get access to the class name of the method which threw exception
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();

        // get access to the method name of the method which threw exception
        String methodName = joinPoint.getSignature().getName();

        // get access to the arguments of the method which threw exception
        Object[] methodArgs = joinPoint.getArgs();
	}
}
```

Let's break down the pointcut expression:

- `within(com.myapp..*)` will match all methods belonging to all the Java packages inside `com.myapp` essentially all methods of an application. If `within` condition wasn't used the aspect would be invoked on Spring beans of other dependencies (e.g. metrics registry beans) so it's a good idea to always limit execution to the methods within our actual application at the very least.
- `execution(* *(..))` will match method execution join points (the only join point type supported by Spring AOP). Here `* *(..)` refers to a method signature: first `*` matches any method return type, second `*` matches any method name, `..` matches any method arguments. If we wanted to match only a specific method `public int getRandomNumber()` we could use the following pointcut expression: `execution(int getRandomNumber())`. It's worth noting that pointcut syntax is the same as that of AspectJ, [please see AspectJ docs for more examples of pointcut expressions](https://www.eclipse.org/aspectj/doc/released/progguide/language-joinPoints.html).

As can be seen we can get access to the exception thrown itself and the metadata of the method which threw the exception. We could do something useful like perhaps send a metric with exception/method data.

Consider the following classes in an application with the above aspect:

```java
public class UserService {
    public User getUser() {
		// simulate exception
        throw new RuntimeException();
    }
}

public class AuthService {
    public void handleAuth() {
        User user = userService.getUser(); // no try/catch
		// do something
    }
}
```

`getUser` throws an exception so the aspect will be invoked on it. `handleAuth` will also exit when `getUser` is called so the aspect **will be invoked again on the same exception** which may or may not be desired. If certain exception related logic needs to be performed exactly once the state has to be tracked somewhere, perhaps using `ThreadLocal` variable (make sure performance doesn't degrade when using `ThreadLocal` variables). Lastly, aspect logic is executed synchronously in the above example: adding time-consuming calculations in the aspect will negatively affect performance.

Note that the problem with the above approach is that we don't get access to exceptions which were caught inside `try/catch`. This is actually impossible to do in Spring AOP however it is possible to achieve this if plain AspectJ is used. AspectJ uses [complilation](https://www.baeldung.com/aspectj) or [load-time weaving](https://www.eclipse.org/aspectj/doc/released/devguide/ltw-configuration.html) in order to provide AOP functionality which will definitely increase build complexity. If AspectJ is used then `"handler(*) && args(e)"` pointcut can be used to access exceptions in `catch` blocks as described [here](https://stackoverflow.com/a/42093318/5863693).

Another problem with the above approach is that we get access to the exception thrown and its metadata however we can't actually handle or catch the exception: by the time the aspect is invoked the method had already exited. In order to actually catch the exception around advice can be used:

```java
package com.myapp.mypackage;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ExceptionHandlingAspect {

	@Pointcut("within(com.myapp..*) && execution(* *(..))")
	public void matchAllMyMethods() {}

	@Around(value = "matchAllMyMethods()")
	public Object doSomethingWithException(ProceedingJoinPoint joinPoint) throws Throwable {
		String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
		String methodName = joinPoint.getSignature().getName();
		Object[] methodArgs = joinPoint.getArgs();

		try {
			// continue the original method execution
			return joinPoint.proceed();
		} catch (Exception exception) {
			// custom aspect logic
			throw exception;
		} finally {
			// custom aspect logic
		}
	}
}
```
The above approach uses `ProceedingJoinPoint` which allows to intercept the actual method which throws the exception, catch the exception and do something about it. Then the exception is re-thrown in order to let the original method also deal with the exception. All this makes around advice probably the most powerful advice available in AOP. You can see the full list of advice supported by Spring AOP [here](https://docs.spring.io/spring-framework/docs/4.3.15.RELEASE/spring-framework-reference/html/aop.html#aop-introduction-defn).

Enjoy aspect-oriented programming!

