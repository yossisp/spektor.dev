---
title: "Why Certain Domains Are Forced To Open As HTTPS in Some Browsers"
date: 2021-09-24T10:39:03.284Z
description: "Why Certain Domains Are Forced To Open As HTTPS in Some Browsers"
tags: "browser, google-chrome, firefox, https"
excerpt: "Recently, I wanted to set up a development environment server and I wanted to access it via a test domain I added in /etc/hosts file which I mapped to localhost..."
---

Recently, I set up a development environment server and I wanted to access it via a test domain I added in /etc/hosts file which I mapped to `localhost`. The domain was `test.dev`. While using `curl` to test server response worked, entering the domain in Google Chrome browser would produce **This site can’t be reached** message:
![This site can’t be reached](./site_cant_be_reached.png)

It turns out that Chrome was redirecting to https and because my server wasn't listening on port 443 I received the error. It was surprising because accessing the server on `localhost` doesn't result in redirect to https. In addition when I added `test.com` to the /etc/hosts file no redirection occurred as well. Accessing `test.dev` in Firefox resulted in the same behavior however accessing it in Brave browser did **not** result in redirect to https. After some digging into this I found that:

1. `.dev` TLD was [bought by Google](https://icannwiki.org/.dev).
2. [Chromium](<https://en.wikipedia.org/wiki/Chromium_(web_browser)>) codebase which Google Chrome is based on has a [file](https://chromium.googlesource.com/chromium/src.git/+/63.0.3239.118/net/http/transport_security_state_static.json#259) `transport_security_state_static.json` which specifies several TLDs where `mode` is `force-https`. The list includes `.dev`.

Therefore, any `.dev` domain will be redirected to https in Chrome. According to [Wikipedia](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security#Limitations) the list of browsers which have a list of TLDs which are forced to load via https includes Firefox and Edge as well.
