---
title: "The Curious Case of Git, macOS Filesystem and Case Sensitivity"
date: "2020-03-21T19:19:03.284Z"
description: "Case Sensitivity on macOS Filesystem and in Git"
---

While working on this blog (which I forked from [here](https://github.com/gatsbyjs/gatsby-starter-blog)) I noticed that I have a file `bio.js` which was a React component. I'm used to capitalizing React components so I renamed the file `Bio.js`. I worked on some other files, made a git commit, pushed the changes and deployed. The build failed. I use Netlify for deployments so I started reading their build logs. The build failed because of this error:

```
Can't resolve './Bio' in '/opt/build/repo/src/components'
```

After some [googling](https://stackoverflow.com/a/53116/5863693) I found out that Git was ignoring letter casing so the remote repository still contained `bio.js`. I changed git config to **not** ignore casing by running this command:

```
git config core.ignorecase false
```

I deployed but the build failed again &#128518. This time the error was:

```
error Multiple "root" queries found: "BioQuery" and "BioQuery".
```

My `Bio.js` component was indeed making a static graphql query but I made sure it was only done once. Then I noticed that I actually had 2 files in Git: `Bio.js` and `bio.js`. I eventually found out that this was happening because macOS is [case-insensitive but case-preserving](https://stackoverflow.com/a/18000286/5863693). This means that as far as macOS is concerned `Bio.js` and `bio.js` are the same file.

Linux is case sensitive of course, so because Netlify uses Linux servers my deployment failed but in development everything worked. So the correct way to change casing in files in macOS which are already in Git is first move them to a temporary location, remove them from Git (using `git rm`), push the changes, then return the file back and add it to Git.

---

By the way, macOS filesystem is not necessarily case-insensitive as in my case. To [find out](https://apple.stackexchange.com/a/22304/228585) regarding your macOS run `diskutil list` in Terminal to list your devices and `diskutil info some-device`. In my case it was `Name (User Visible): Mac OS Extended (Journaled)` which means it's not case sensitive but it can also be `Mac OS Extended (Case-sensitive, Journaled)`
