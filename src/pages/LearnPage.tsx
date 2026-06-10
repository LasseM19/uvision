import { Card } from '../components/Card'
import { AccountSubpageHeader } from '../components/AccountSubpageHeader'
import { useI18n } from '../hooks/useI18n'

export function LearnPage() {
  const { t, educationArticles } = useI18n()

  return (
    <div className="page">
      <AccountSubpageHeader title={t('learn.title')} />

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
