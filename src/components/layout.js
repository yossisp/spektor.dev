import React from "react"
import { ThemeProvider } from "styled-components"
import { theme } from "theme"
import { Link } from "system"

import { rhythm, scale } from "../utils/typography"

const Layout = ({ location, title, children }) => {
  console.log("__PATH_PREFIX__", __PATH_PREFIX__)
  const rootPath = `${__PATH_PREFIX__}/`
  let header

  if (location.pathname === rootPath) {
    header = (
      <h1
        style={{
          ...scale(0.75),
          marginBottom: rhythm(1.5),
          marginTop: 0,
        }}
      >
        <Link to={`/`}>{title}</Link>
      </h1>
    )
  } else {
    header = (
      <h3
        style={{
          fontFamily: `Montserrat, sans-serif`,
          marginTop: 0,
        }}
      >
        <Link to={`/`}>{title}</Link>
      </h3>
    )
  }
  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: rhythm(24),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        <header>{header}</header>
        <main>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </main>
        <footer>
          <a href={`https://twitter.com/SpektorYossi`}>
            <strong>twitter</strong>
          </a>
        </footer>
      </div>
    </ThemeProvider>
  )
}

export default Layout
