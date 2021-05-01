import React from "react"
import { graphql } from "gatsby"
import { Bio, SEO, Layout, Tags } from "components"
import { Link } from "theme"
import { rhythm } from "../utils/typography"

const TAGS_DELIMITER = ", "

const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="Spektor?.dev" />
      <Bio />
      {posts.map(({ node }) => {
        const title = node.frontmatter.title || node.fields.slug
        const tags = node.frontmatter.tags?.split(TAGS_DELIMITER)
        return (
          <article key={node.fields.slug}>
            <header>
              <h3
                style={{
                  marginBottom: rhythm(1 / 4),
                }}
              >
                <Link to={node.fields.slug}>{title}</Link>
              </h3>
              <small>{node.frontmatter.date}</small>
              <Tags tags={tags} />
            </header>
            <section>
              <Link to={node.fields.slug}>
                <p
                  style={{ color: "hsla(0,0%,0%,0.9)" }}
                  dangerouslySetInnerHTML={{
                    __html: node.excerpt,
                  }}
                />
              </Link>
            </section>
          </article>
        )
      })}
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt(pruneLength: 200)
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
            tags
          }
        }
      }
    }
  }
`
