import styled from "styled-components"
import { space, border, color } from "styled-system"
import propTypes from "@styled-system/prop-types"

const Card = styled.div`
  ${space}
  ${border}
  ${color}
`

Card.displayName = "Card"
Card.propTypes = {
  ...propTypes.space,
  ...propTypes.border,
  ...propTypes.color,
}

export default Card
