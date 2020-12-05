---
title: "MongoDB vs SQL: Sorting"
date: "2020-12-05T15:31:03.284Z"
description: "MongoDB vs SQL: Sorting"
---

<div style="display:flex;align-items:center;padding-left:10%;padding-right:10%;padding-bottom:50px;">
    <div style="width:30%;">
        <img src="mongodb.png"
            alt="MongoDB"
            style="margin:0;"
            />
    </div>
        <span style="font-size: 32px;padding-left:16px;padding-right:16px;"> vs </span>
    <div style="width:30%;">
    <img src="sql.png"
        alt="SQL"
        />
    </div>
</div>

Recently, I had to add several API endpoints which provide pagination, filter and sort parameters to the client while using MongoDB as database. Implementing pagination and filtering wasn't complicated however I hit a major setback when implementing sorting logic. The reason was that sorting is not enabled on virtual fields in MongoDB. This is as opposed to SQL where calculated fields can be sorted. For applications which have a lot of virtual fields the above-mentioned MongoDB missing feature can be a major disadvantage (for example if database data has a lot of fields which need to be translated based on user language).

Eventually, I ended up with creating a script which would populate the database with the virtual fields which is reasonable because the database is relatively small and is not expected to become very big. However, for applications with large databases this may not be a reasonable solution, of course. In that case perhaps migrating to an SQL based database may be needed.
