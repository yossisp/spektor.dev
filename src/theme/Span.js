import styled from "styled-components"
import { space, border, color, layout } from "styled-system"
import propTypes from "@styled-system/prop-types"
import { bold, crossed } from "system"

const Span = styled.span`
    ${space}
    ${border}
    ${color}
    ${layout}
    ${bold}
    ${crossed}
`
Span.displayName = "Span"
Span.propTypes = {
  ...propTypes.span,
}

export default Span
