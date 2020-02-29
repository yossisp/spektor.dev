import styled from "styled-components"
import { shadoq } from "styled-system"
import { Link as GatsbyLink } from "gatsby"

const Link = styled(GatsbyLink)`
  box-shadow: none;
`
Link.displayName = "StyledLink"

export default Link
