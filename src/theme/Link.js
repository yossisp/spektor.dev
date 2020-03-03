import React from "react"
import styled from "styled-components"
import { color } from "styled-system"
import { Link as GatsbyLink } from "gatsby"

const StyledGatsbyLink = styled(GatsbyLink)`
  box-shadow: none;
`
StyledGatsbyLink.displayName = "StyledLink"

const Link = ({ external, to, target = "_blank", className, children }) => {
  if (external) {
    console.log("external to", to)
    return (
      <a className={className} href={to} target={target}>
        {children}
      </a>
    )
  }

  return (
    <StyledGatsbyLink className={className} to={to}>
      {children}
    </StyledGatsbyLink>
  )
}

const StyledLink = styled(Link)`
  ${color}
`

export default StyledLink
