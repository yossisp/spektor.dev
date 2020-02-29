import styled from "styled-components"
import { flexbox } from "styled-system"
import propTypes from "@styled-system/prop-types"
import Card from "./Card"

const Flex = styled(Card)`
  display: flex;
  ${flexbox}
`

Flex.displayName = "Flex"
Flex.propTypes = {
  ...propTypes.flexbox,
}

export default Flex
