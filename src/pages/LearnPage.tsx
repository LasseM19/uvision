import { Card } from '../components/Card'
import { AccountSubpageHeader } from '../components/AccountSubpageHeader'
import { educationArticles } from '../data/education'

export function LearnPage() {
  return (
    <div className="page">
      <AccountSubpageHeader title="Learn about UV" />

      <div className="article-list">
        {educationArticles.map((article) => (
          <Card key={article.id} className="article-card">
            <h2 className="article-title">{article.title}</h2>
            <p className="article-body">{article.body}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
