import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { educationArticles } from '../data/education'

export function LearnPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="page-title">Learn about UV</h1>
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

      <Link to="/account" className="text-link">
        ← Back to account
      </Link>
    </div>
  )
}
