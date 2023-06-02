---
title: "Spring Modulith"
date: 2023-05-20T19:19:03.284Z
description: "Spring Modulith."
tags: "java, spring, DDD"
excerpt: Spring Modulith...
---

<div style="display:flex;justify-content:center;padding-right:10%;padding-bottom:50px;padding-top:30px;">
    <img style="min-width:100px;max-width:200px" src="./dapr_logo.svg"
            alt="DAPR Logo"
            style="margin:0;"
            />
</div>

1. [What is Spring Modulith?](#what-is-spring-modulith)


### <a name="what-is-spring-modulith"></a>What is Spring Modulith?
[Spring Modulith](https://docs.spring.io/spring-modulith/docs/current-SNAPSHOT/reference/html/) is Spring Boot project which focuses on architectural [best-practices](https://docs.spring.io/spring-modulith/docs/current-SNAPSHOT/reference/html/#fundamentals):

>Spring Modulith supports developers implementing logical modules in Spring Boot applications.

The project aims to provide structure based on [domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design) principles, it encourages to create Java packages by domain: instead of grouping all controllers under `controllers` folder or all models under `model` folder we're encouraged to have a Java package for orders or users which will contain all the serices/controllers/models related to those domains. 

It is beside the scope of the post to argue in favor of the above structure however a good parallel would be organizing household items in your home: you probably wouldn't have an area of your house dedicated specifically to electrical appliances but rather you would have a mixer in the kitchen, a TV in the living room annd so on.

Below are the main architectural principles of Spring Modulith:

- The project regards an application module as a unit of functionality in a Spring Boot application: it consists of externally exposed interfaces and internal logic.
- By default, each direct sub-package of the main package is considered an application module package. 
- Any sub-package of an application module package is considered to be internal.
- Code from other application modules is allowed to refer to types ther application modules.
- Code within internal pacakges must not be referred to from other modules.

Looking at the project structure below there're two application module packages: `inventory` and `order`.
```
.
|-- README.md
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- example
    |   |       |-- Application.java
    |   |       |-- inventory
    |   |       |   |-- InventoryManagement.java
    |   |       `-- order
    |   |           |-- Order.java
```

It's quite easy to hide the code from one package to another: classes with package-private access modifier are not accessible from other packages.

Let's take a look at another example of project structure:
```
.
|-- README.md
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- example
    |   |       |-- Application.java
    |   |       |-- inventory
    |   |       |   |-- InventoryManagement.java
    |   |       `-- order
    |   |           |-- Order.java
    |   |           |-- internal
    |   |           |   `-- OrderInternal.java

```
In this scenario `Order` uses `OrderInternal` logic, this `OrderInternal` cannot be package-private and must be public which unfortunately makes it accessible to other application modules. This is where Modulith comes in: in case some code in `inventory` package refers to `OrderInternal` it will automatically recognize this architecture violation. In practice this is achieved by adding an integration test:
```java
class ModularityTests {

	ApplicationModules modules = ApplicationModules.of(Application.class);

	@Test
	void verifiesModularStructure() {
		modules.verify();
	}
}
```
Running the above test would fail with the following error message:
```
ModularityTests.verifiesModularStructure:33 ? 
Violations - Module 'inventory' depends on non-exposed 
type example.order.internal.OrderInternal
within module 'order'!
```
Behind the scenes Modulith uses [ArchUnit](https://www.archunit.org/) project to enforce various architectural rules.

In addition, we can explicitly declare which module dependencies using `package-info.java` file:
```java
@org.springframework.modulith.ApplicationModule(
  allowedDependencies = "order"
)
package example.inventory;
```

Consider the following example where `inventory` package would declare dependency only on `order` package but later someone would use `User` class from `user` package which is not a declared dependency.
```
.
|-- README.md
|-- pom.xml
|-- src
|   |-- main
|   |   |-- java
|   |   |   `-- example
|   |   |       |-- Application.java
|   |   |       |-- inventory
|   |   |       |   |-- InventoryManagement.java
|   |   |       |-- order
|   |   |       |   |-- Order.java
|   |   |       `-- user
|   |   |           `-- User.java
```
Modularity test would fail with the following message:
```
 ModularityTests.verifiesModularStructure:33 ? 
 Violations - Module 'inventory' depends on module 'user' via 
 example.inventory.InventoryManagement -> example.user.User.
 Allowed targets: order
 ```

 While it's great to stick to these conventions in real life project architecture may be more complicated and you may need to expose logic from an internal package to another application module. This can be achieved using by creating a `package-info.java` file inside that internal package and adding `@org.springframework.modulith.NamedInterface("some-internal-package")`. If we wanted to expose `order.internal` package in the following project:
 ```
.
|-- README.md
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- example
    |   |       |-- Application.java
    |   |       |-- inventory
    |   |       |   |-- InventoryManagement.java
    |   |       `-- order
    |   |           |-- Order.java
    |   |           |-- internal
    |   |           |   `-- OrderInternal.java

```
We would create the following `package-info.java` file in `order.internal` package:
```java
@org.springframework.modulith.NamedInterface("order-internal")
package example.order.internal;
```
This would immediately allow to use `OrderInternal` class in `inventory` package. As an additional option we could specify that `inventory` package depends solely on `order.inventory` package as follows:
```java
@org.springframework.modulith.ApplicationModule(
        allowedDependencies = "order::order-internal"
)
package example.inventory;
```

To summarize, the default rules which are checked for when running `verify()` test are:

- No cycles on the application module level.

- All references to types that reside in application module internal packages are rejected.

- If explicit dependencies are configured, dependencies to other application modules are rejected.

It's worth noting that if the default architecture model which comes with Modilith doesn't suit your needs it can be [customized](https://docs.spring.io/spring-modulith/docs/current-SNAPSHOT/reference/html/#fundamentals.customizing-modules).

### Modulith Approach to Application Events
Let's take a look at the following example:
```java
@Service
@RequiredArgsConstructor
public class OrderManagement {

  private final InventoryManagement inventory;

  @Transactional
  public void complete(Order order) {
    inventory.updateStockFor(order);
  }
}
```
>The `complete(…)` method creates functional gravity in the sense that it attracts related functionality and thus interaction with Spring beans defined in other application modules. 

This means that in order to test `OrderManagement` its dependencies must be available as well either as real instances or mocked. Spring events can be used to decouple the functionality:
```java
@Service
@RequiredArgsConstructor
public class OrderManagement {

  private final ApplicationEventPublisher events;

  @Transactional
  public void complete(Order order) {
    events.publishEvent(new OrderCompleted(order.getId()));
  }
}
```
Now `ApplicationEventPublisher` Spring class is used to publish `OrderCompleted` event which can then be consume by `InventoryManagement`. By default, Spring events are published [synchronously](https://www.baeldung.com/spring-events#anonymous-events), that is after the event is published it will be consumed in the same thread by a listener. On the one hand this offers a simpler mental model to reason about events, on the other hand the event consumer participates in the original transaction which widens  transaction boundary and increases the chances for the transaction to fail.

The above issue can be mitigated by implementing an asynchronous consumer of application events:
```java
@Component
class InventoryManagement {

  @Async
  @TransactionalEventListener
  void on(OrderCompleted event) { /* … */ }
}
```
Using `@TransactionalEventListener` allows to commit the transaction started by `complete()` order method but its `TransactionPhase` is set to `AFTER_COMMIT` by default which according to the [docs](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/TransactionSynchronization.html#afterCompletion(int)) means:
> The transaction will have been committed already, but the transactional resources might still be active and accessible

This is why `@Async` is used as well as `@Transactinal` cannot cross over to other threads.

### Integration Testing
Spring Modulith allows to set up integration tests via `@ApplicationModuleTest` annotation similar to `@SpringBootTest`. However `@ApplicationModuleTest` exposes more functionality, first and foremost, bootstrap modes:
- `STANDALONE` (default) — Runs the current module only.

- `DIRECT_DEPENDENCIES` — Runs the current module as well as all modules the current one directly depends on.

- `ALL_DEPENDENCIES` — Runs the current module and the entire tree of modules depended on.

This is quite handy because we get these bootstrap modes out of the box as opposed to having to manually create [slices](https://spring.io/blog/2016/08/30/custom-test-slice-with-spring-boot-1-4) in Spring Boot tests.