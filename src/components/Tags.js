import React from "react"
import { Flex, Span } from "theme"

const Tags = ({ tags }) => {
  if (!tags?.length) {
    return null
  }
  return (
    <Flex py="8px">
      {tags.map(tag => (
        <Span pr="8px" key={tag}>
          <Span
            className="article-tags"
            color="orange"
            px="4px"
            py="2px"
            border="1px solid orange"
            borderRadius="4px"
          >
            {tag}
          </Span>
        </Span>
      ))}
    </Flex>
  )
}

export default Tags
