---
title: "Simple Pagination In React Or How To Implement Infinite Scroll"
date: 2020-05-29T11:15:03.284Z
description: "Simple Pagination In React Or How To Implement Infinite Scroll"
---

Often times a website needs to implement some kind of pagination solution, for example if a list of products is displayed and all products can't be shown at once (for performance or other reasons). Firstly, standard button-based pagination can be used (as in Amazon.com for example). However, implementing such pagination can be a bit tricky for the sheer number of edge cases, especially if you want to implement `...` functionality in pagination. That is, say, there're 20 pages in total and you want to display the pagination as follows: `1 2 3 ... 20`.

Luckily, there's a much simpler solution which also has the modern feel: infinite scroll. The way it works is you scroll to the bottom of a page and this triggers loading more items/products in the website. Perhaps the technique is most familiar from Facebook news feed.

Implementing infinite scroll is extremely easy. It all comes down to attaching a handler to `window.onscroll` event:

```js
import { useEffect } from "react"
import debounce from "lodash/debounce"

export const ProductsList = props => {
  // component business logic

  useEffect(() => {
    const onscrollHandler = debounce(
      () => {
        if (
          // height of the visible window
          window.innerHeight +
            // how far the user has scrolled
            document.documentElement.scrollTop ===
          // full height of the window (both visible and not visible)
          document.documentElement.offsetHeight
        ) {
          // onscroll logic (querying for more products perharps)
        }
      },
      100,
      { leading: true }
    )

    window.addEventListener("scroll", onscrollHandler)
    return () => {
      window.removeEventListener("scroll", onscrollHandler)
    }
  }, [])

  return <div>List of products here</div>
}
```

It is recommended to use `debounce` in order to prevent overflooding of scroll events (there's actually a great [article](https://css-tricks.com/debouncing-throttling-explained-examples/) on debouncing events). As you can see the solution involves only 1 `if` block which is pretty neat!
