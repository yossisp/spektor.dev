import styled from "styled-components"
import { Link as GatsbyLink } from "gatsby"

const Link = styled(GatsbyLink)`
  box-shadow: none;
`
Link.displayName = "StyledLink"

export default Link
