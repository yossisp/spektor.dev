---
title: "How To Add SQL Constraint Without Applying It To The Existing Rows in PostgreSQL"
date: 2022-09-10T19:19:03.284Z
description: "How to Add New SQL Constraint Without Applying It to the Existing Rows in PostgreSQL or how to apply SQL constraint only to future insertions or updates on rows"
tags: "sql, postgresql, constraint, tip"
---

<div style="display:flex;justify-content:center;padding-right:10%;padding-bottom:50px;padding-top:30px;">
    <img style="min-width:100px;max-width:200px" src="./postgresql_logo.svg"
            alt="Postgres Logo"
            style="margin:0;"
            />
</div>

Often times product requirements change and software engineers need to change the existing data model. For example, imagine an intentionally simplistic Postgres table for book orders which contains such details as order id, and order quantity (number of book copies for the order). One day the company decides to add expedited shipping option. Now the order table should have another column `shipping_type` which can be `standard` or `expedited`. Suppose the table has millions of rows and the company doesn't care about the shipping type of old orders. The new column should be not null and have only the two above-mentioned values for now (perhaps in the future there will be a third option). How can the column be added in the most efficient way? Before we consider the available options let's create the `orders` table:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  quantity SMALLINT
);

INSERT INTO orders(quantity)
VALUES (2);
```

#### Option 1: Add Not Null Constraint with Default Value

Remember the old rows don't have the `shipping_type` column and because the new column needs to be added with a not null constraint some default value needs to be given for the column in the old rows. For example, their `shipping_type` can be `standard`:

```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_type varchar(9) NOT NULL DEFAULT 'standard';
```

This works but what happens behind the scenes? Depending on the character set defined in the database a character requires at least 1 byte in memory. In addition, depending on the string length there's an additional [overhead](https://www.postgresql.org/docs/current/datatype-character.html) of 1-4 bytes per row. Because `shipping_type` is `varchar(9)` (there're 9 letters in the word `expedited`) we add 1 more byte of overhead which becomes 10 bytes per row at least. Suppose the database has 1 million rows adding the default value will result in 10 MB additional storage which is not that bad. In case the database character set was UTF8 up to 4 bytes can be required to store 1 character in which case adding the default value would add `(9 * 4) + 1 = 37` (1 byte for the overhead) bytes per row, that is another 37 MB for a million rows. If there's more than a million rows and columns with default values are occasionally added this can certainly add up (as a sidenote using a Postgres enum could be beneficial in such case as it occupies only [4 bytes](https://www.postgresql.org/docs/current/datatype-enum.html#id-1.5.7.15.8) in memory).

An even more important concern is a multi-million row update of a production database. Firstly, this may significantly affect database performance and is echoed in Postgres [docs](https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-NOTES):
>Scanning a large table to verify a new foreign key or check constraint can take a long time, and other updates to the table are locked out until the ALTER TABLE ADD CONSTRAINT command is committed.

Indeed, adding a constraint [will result](https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-NOTES) in `ACCESS EXCLUSIVE` lock for the table which will block [both updates and reads](https://www.postgresql.org/docs/current/explicit-locking.html)(!) to the table until the constraint is validated.

There's a better way.

#### Option 2: Adding Constraint Only For Future Rows

As already mentioned, the company isn't really interested in the old orders `shipping_type`. Is there a way to add the not null constraint in such a way that it's applied only to the future rows and not to the existing rows? Yes there is: [NOT VALID](https://www.postgresql.org/docs/current/sql-altertable.html). Normally, when a new constraint is added the table is scanned to verify that the existing rows satisfy the constraint. However, if `NOT VALID` is applied the full table scan is skipped but the constraint will still be enforced against subsequent inserts or updates. This is a win-win situation where we still get constraint checking on future updates while not locking out the table:

```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_type varchar(9);

ALTER TABLE orders ADD CONSTRAINT shipping_type_not_null CHECK (shipping_type IS NOT NULL) NOT VALID;
```

If additional space which would be created by setting a default value to existing rows is not a concern one could write a migration script which would incrementally add default value to the existing rows and then run `ALTER TABLE orders VALIDATE CONSTRAINT shipping_type_not_null;` in order to validate that there aren't any rows left without a default value. This operation acquires `SHARE UPDATE EXCLUSIVE` lock which protects a table against concurrent schema changes (but doesn't block row reads/writes). However, in case of foreign key constraint a ROW SHARE lock is also required on the table referenced by the constraint which can have performance consequences.

**To summarize**: using `NOT VALID` can significantly boost performance when adding new constraint on a Postgres table and even potentially prevent application downtime because of table locking.