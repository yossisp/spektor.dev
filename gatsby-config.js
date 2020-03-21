module.exports = {
  siteMetadata: {
    title: `Spektor.dev`,
    titleAlt: "Spektor.dev", // Title for JSONLD
    headline: "Content for Spektor.dev", // Headline for schema.org JSONLD
    author: {
      name: `Yossi Spektor`,
      summary: `about software development.`,
    },
    description: `The blog is about interesting software bugs I came across and programming tips that I would like to share.`,
    siteUrl: `https://www.spektor.dev`,
    social: {
      twitter: `SpektorYossi`,
    },
    siteLanguage: `en`,
    logo: "/favicon.ico", // Used for SEO
    // JSONLD / Manifest
    favicon: "static/favicon.ico", // Used for manifest favicon generation
    shortName: "Spektor.dev", // shortname for manifest. MUST be shorter than 12 characters
    profilePic:
      "https://res.cloudinary.com/forcepam/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1584732685/egiwwstex9qqudasfvgq.jpg",
    siteLogo:
      "https://res.cloudinary.com/forcepam/image/upload/c_thumb,w_300,g_face/v1584804134/ddwxkvjv2wseyqc2wkpo.png",
    headline: "A blog about software development",
    ogLanguage: "en_US",
    twitter: "@SpektorYossi",
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-159981262-1`,
        head: false,
      },
    },
    `gatsby-plugin-feed`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Spektor.dev Blog`,
        short_name: `Spektor.dev`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `content/assets/favicon/android-chrome-512x512.png`,
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
