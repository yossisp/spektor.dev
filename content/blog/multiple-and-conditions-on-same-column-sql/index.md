---
title: "How To Make SQL Queries With Multiple AND Conditions On Same Column in SQL"
date: 2021-05-07T11:19:03.284Z
description: "How To Make SQL Queries With Multiple AND Conditions On Same Column in SQL."
tags: "sql"
---

Recently, a colleague approached me to help with building an SQL query. It was an interesting problem in my opinion and the solution to it is quite generic and can be applied to many similar problems.

My colleague had a table of producers and consumers, where consumer to producer was a many-to-many relationship. She wanted to get all consumers which interacted with **at least all** the producers from a given list.

This is a sample table called `mytable`:

| id  | consumer | producer |
| --- | -------- | -------- |
| 1   | c1       | p1       |
| 2   | c1       | p2       |
| 3   | c2       | p1       |
| 4   | c2       | p2       |
| 5   | c3       | p1       |
| 6   | c3       | p2       |
| 7   | c3       | p3       |
| 8   | c4       | p1       |

In this table given a list of producers `p1` and `p2`, the output should be consumers `c1`, `c2` and `c3`. `c4` will not be in the output because it only interacted with `p1` but not with `p2`. Also `c3` will be in the output because it's enough that it interacts with `p1` and `p2` even though `c3` also interacts with `p3`.

1. [SQL solution](#sqlsolution)
2. [PostgreSQL solution](#postgresqlsolution)

## SQL solution <a name="sqlsolution"></a>

The first instinct is to use SQL `IN` operator, something like:

```sql
SELECT * FROM mytable
WHERE producer IN ('p1', 'p2')
```

However this will not produce correct results because SQL `IN` operator is just a shorthand for multiple `OR` conditions. However, we really need multiple `AND` conditions. Multiple `AND` conditions can't be used on the same column, therefore after `IN` is used, we can first group by consumer and then make sure that the number of rows equals the number of producers in the input:

```sql
SELECT consumer FROM mytable
WHERE producer IN ('p1', 'p2')
GROUP BY consumer
HAVING COUNT(*) = 2
```

The above query correctly returns the list of consumers (`c1`, `c2` and `c3`). It's important to note that if the combination of consumers and producers wasn't unique, then `DISTINCT` would need to be added into rows count:

```sql
SELECT consumer FROM mytable
WHERE producer IN ('p1', 'p2')
GROUP BY consumer
HAVING COUNT(DISTINCT producer) = 2
```

Finally, in order to get the rows of `mytable` which satisfy the original condition the following query can be executed:

```sql
SELECT * FROM mytable
WHERE consumer IN (
    SELECT consumer FROM mytable
    WHERE producer IN ('p1', 'p2')
    GROUP BY consumer
    HAVING COUNT(*) = 2
)
```

You can run the sample query in this playground [link](https://www.db-fiddle.com/f/hHCyXADG7dPGgsdf6kVf9d/8).

## PostgreSQL solution <a name="postgresqlsolution"></a>

If you're using PostgreSQL there's another solution using `array_agg` aggregate [function](https://www.postgresql.org/docs/9.5/functions-aggregate.html). First a list of producers can be aggregated per each consumer using `array_agg`. Secondly, `@>` contains [operator](https://www.postgresql.org/docs/current/functions-array.html) can be used to check whether input array of producers is contained in the result of `array_agg`:

```sql
SELECT * FROM (
  SELECT consumer, array_agg(producer) producers FROM mytable
  GROUP BY consumer
) AS t WHERE t.producers @> '{p1, p2}'
```

You can run the sample query in this playground [link](https://www.db-fiddle.com/f/hHCyXADG7dPGgsdf6kVf9d/8).
