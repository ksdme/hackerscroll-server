export default interface ArticleContent {
  // Borrowed from signature of Readability.parse().
  title: string
  byline: string
  dir: string
  content: string
  textContent: string
  length: number
  excerpt: string
}
