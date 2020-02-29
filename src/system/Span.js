import styled from "styled-components"
import { space, border, color, layout } from "styled-system"
import propTypes from "@styled-system/prop-types"

const Span = styled.span`
    ${space}
    ${border}
    ${color}
    ${layout}
    ${({ bold }) => bold && "font-weight: 700;"}
    ${({ crossed }) => crossed && "text-decoration: line-through;"}
`
Span.displayName = "Span"
Span.propTypes = {
  ...propTypes.span,
}

export default Span
