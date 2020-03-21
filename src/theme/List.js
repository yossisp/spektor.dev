import styled from "styled-components"
import { space, border } from "styled-system"
import propTypes from "@styled-system/prop-types"

const List = styled.ul`
  ${noStyle => noStyle && "list-style: none;"}
  ${space}
  ${border}
`

List.displayName = "List"
List.propTypes = {
  ...propTypes.space,
  ...propTypes.border,
}

export default List
