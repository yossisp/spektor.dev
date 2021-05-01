---
title: "How to Create a Simple Slideshow Component in React"
date: 2020-08-28T09:41:03.284Z
description: "How to Create a Simple Slideshow Component in React"
---

I recently had to create a slidehow component, something along [these](https://react-slideshow.herokuapp.com/fade-effect) lines. I was surprised how easy it is to create such a component and would like to share an example below. In the example I will be concentrating on logic more rather than on the UI design.

The component will be changing slides every `n` seconds. Also the component will have buttons area below (a button per each slide) so that the user can click a button and thus change a slide.

Because slides are changed only in one direction (unless the user clicks a particular button) essentially a circular linked list data structure would serve us best. But such data structure is not provided by Javascript therefore we'll use an array. We will need state to hold the current image as well. It's important to understand that although we'll be using an array we want to somehow achieve the "circular" property therefore we can use modulo operation in order to get the index of the next slide to show:

```js
const initialIndex = 0
const SlideShow = ({ slides, intervalBetweenSlidesSec = 5 }) => {
  const [activeSlide, setActiveSlide] = useState({
    slide: slides[initialIndex],
    index: initialIndex,
  })

  const changeSlides = () =>
    setActiveSlide(({ index }) => {
      const nextIndex = (index + 1) % slides.length
      return {
        slide: slides[nextIndex],
        index: nextIndex,
      }
    })
}
```

The next piece of functionality we need to add is an interval so that the slides will be changed automatically every `intervalBetweenSlidesSec` seconds. If the user clicks on a certain button the previous interval must be cleared and a new one created. Because the interval id will be used both inside `useEffect` which kicks off automatic slides change and in the button `onClick` handler the interval id must be stored in a variable which will be accessible in those both places, a ref. This is the complete example:

```jsx
const MILLIS = 1000
const initialIndex = 0
const SlideShow = ({ slides, intervalBetweenSlidesSec = 5 }) => {
  const [activeSlide, setActiveSlide] = useState({
    slide: slides[initialIndex],
    index: initialIndex,
  })
  const intervalRef = useRef()
  const changeSlides = useCallback(() => {
    setActiveSlide(({ index }) => {
      const nextIndex = (index + 1) % slides.length
      return {
        slide: slides[nextIndex],
        index: nextIndex,
      }
    })
  }, [slides])

  useEffect(() => {
    intervalRef.current = setInterval(
      changeSlides,
      intervalBetweenSlidesSec * MILLIS
    )

    return () => clearInterval(intervalRef.current)
  }, [changeSlides, intervalBetweenSlidesSec])

  const {
    slide: { src, alt, title },
  } = activeSlide
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div>
        <img src={src} alt={alt} title={title} style={{ height: 200 }} />
      </div>
      <div
        style={{ position: "absolute", zIndex: 1, bottom: 1, width: "100%" }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          {slides.map((_, index) => {
            return (
              <span
                key={index}
                style={{ paddingRight: index !== slides.length - 1 ? 20 : 0 }}
              >
                <button
                  style={{
                    height: 16,
                    display: "inline-block",
                    borderRadius: "100%",
                    background: activeSlide.index === index ? "black" : "white",
                  }}
                  onClick={() => {
                    setActiveSlide({
                      slide: slides[index],
                      index,
                    })
                    clearInterval(intervalRef.current)
                    intervalRef.current = setInterval(
                      changeSlides,
                      intervalBetweenSlidesSec * MILLIS
                    )
                  }}
                />
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

I wanted to wrap the buttons inside a `div` with absolute position so that if the images are of different dimensions (which is not recommended but can happen) there's no jump and the buttons area always stays in the same place.

The only thing missing is some animation. I think fade in animation will work great in this case. Because I often use such animation I created a custom hook for it:

```js
import { useState, useCallback } from "react"

const useFadeAnimation = (options = {}) => {
  const { animationDuration = 1000, animateInitially = false } = options
  const [showAnimation, setShowAnimation] = useState(animateInitially)
  const animate = useCallback(() => {
    setShowAnimation(true)
    setTimeout(() => setShowAnimation(false), animationDuration + 100)
  }, [animationDuration])

  return {
    showAnimation,
    animate,
  }
}
```

We'll also create animation component using [styled-components](https://styled-components.com/) from this awesome [article](https://medium.com/codeuai/working-with-animations-using-styled-components-de4dca3a0e79). You can find the code for this in the codesandbox link below.

The final result can be seen below and of course you can check out the code using the link below!

<iframe src="https://codesandbox.io/embed/slideshow-67skz?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="SlideShow"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
