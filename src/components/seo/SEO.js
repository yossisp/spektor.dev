import React from "react"
import Helmet from "react-helmet"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import Twitter from "./Twitter"
import Facebook from "./Facebook"

// Complete tutorial: https://www.gatsbyjs.org/docs/add-seo-component/
const SEO = ({ title, desc, pathname, post }) => {
  const { site } = useStaticQuery(query)

  const {
    buildTime,
    siteMetadata: {
      siteUrl,
      defaultTitle,
      defaultDescription,
      siteLogo,
      headline,
      siteLanguage,
      ogLanguage,
      author,
      twitter,
      facebook,
    },
  } = site

  const seo = {
    title: title || defaultTitle,
    description: desc || defaultDescription,
    image: siteLogo,
    url: `${siteUrl}${pathname || ""}`,
  }

  // schema.org in JSONLD format
  // https://developers.google.com/search/docs/guides/intro-structured-data
  // You can fill out the 'author', 'creator' with more data or another type (e.g. 'Organization')

  const schemaOrgWebPage = {
    "@context": "http://schema.org",
    "@type": "WebPage",
    url: siteUrl,
    headline,
    inLanguage: siteLanguage,
    mainEntityOfPage: siteUrl,
    description: defaultDescription,
    name: defaultTitle,
    author: {
      "@type": "Person",
      name: author.name,
    },
    copyrightHolder: {
      "@type": "Person",
      name: author.name,
    },
    copyrightYear: "2019",
    creator: {
      "@type": "Person",
      name: author.name,
    },
    publisher: {
      "@type": "Person",
      name: author.name,
    },
    datePublished: "2019-01-18T10:30:00+01:00",
    dateModified: buildTime,
    image: {
      "@type": "ImageObject",
      url: `${siteLogo}`,
    },
  }

  // Initial breadcrumb list

  const itemListElement = [
    {
      "@type": "ListItem",
      item: {
        "@id": siteUrl,
        name: "Homepage",
      },
      position: 1,
    },
  ]

  let schemaArticle = null

  if (post) {
    schemaArticle = {
      "@context": "http://schema.org",
      "@type": "Article",
      author: {
        "@type": "Person",
        name: author.name,
      },
      copyrightHolder: {
        "@type": "Person",
        name: author.name,
      },
      copyrightYear: "2019",
      creator: {
        "@type": "Person",
        name: author.name,
      },
      publisher: {
        "@type": "Organization",
        name: author.name,
        logo: {
          "@type": "ImageObject",
          url: `${siteLogo}`,
        },
      },
      datePublished: post.frontmatter.date,
      // dateModified: node.last_publication_date,
      description: seo.description,
      headline: seo.title,
      inLanguage: siteLanguage,
      url: seo.url,
      name: seo.title,
      image: {
        "@type": "ImageObject",
        url: seo.image,
      },
      mainEntityOfPage: seo.url,
    }

    // Push current blogpost into breadcrumb list
    itemListElement.push({
      "@type": "ListItem",
      item: {
        "@id": seo.url,
        name: seo.title,
      },
      position: 2,
    })
  }

  const breadcrumb = {
    "@context": "http://schema.org",
    "@type": "BreadcrumbList",
    description: "Breadcrumbs list",
    name: "Breadcrumbs",
    itemListElement,
  }

  return (
    <>
      <Helmet title={seo.title}>
        <html lang={siteLanguage} />
        <meta name="description" content={seo.description} />
        <meta name="image" content={seo.image} />
        <meta name="gatsby-starter" content="Gatsby Starter Prismic" />
        {/* Insert schema.org data conditionally (webpage/article) + everytime (breadcrumbs) */}
        {!post && (
          <script type="application/ld+json">
            {JSON.stringify(schemaOrgWebPage)}
          </script>
        )}
        {!!post && (
          <script type="application/ld+json">
            {JSON.stringify(schemaArticle)}
          </script>
        )}
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>
      <Twitter
        title={seo.title}
        image={seo.image}
        desc={seo.description}
        username={twitter}
      />
      <Facebook
        desc={seo.description}
        image={seo.image}
        title={seo.title}
        type={post ? "article" : "website"}
        url={seo.url}
        locale={ogLanguage}
        name={facebook}
      />
    </>
  )
}

SEO.propTypes = {
  title: PropTypes.string,
  desc: PropTypes.string,
  banner: PropTypes.string,
  pathname: PropTypes.string,
  post: PropTypes.object,
}
SEO.defaultProps = {
  title: null,
  desc: null,
  banner: null,
  pathname: null,
  post: null,
}

export default SEO

const query = graphql`
  query SEO {
    site {
      buildTime(formatString: "YYYY-MM-DD")
      siteMetadata {
        siteUrl
        defaultTitle: title
        defaultDescription: description
        siteLogo
        headline
        siteLanguage
        ogLanguage
        author {
          name
        }
        twitter
        # facebook
      }
    }
  }
`
