import { Card } from '../components/Card'
import { educationArticles } from '../data/education'

export function LearnPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Learn</p>
          <h1 className="page-title">Sun safety tips</h1>
        </div>
      </header>

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
