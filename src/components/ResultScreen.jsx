import './ResultScreen.css'

export default function ResultScreen({ result, onRestart, onHome }) {
  const { score, total, vsScores, vsNames, mode, wordsFound } = result
  const isVs = mode === 'vs'
  const isWords = mode === 'words'

  let emoji, title, subtitle

  if (isVs) {
    const name1 = vsNames?.[0] || 'Jucător 1'
    const name2 = vsNames?.[1] || 'Jucător 2'

    if (vsScores[0] > vsScores[1]) {
      emoji = '🏆'
      title = `${name1} câștigă!`
      subtitle = `${vsScores[0]} - ${vsScores[1]}`
    } else if (vsScores[1] > vsScores[0]) {
      emoji = '🏆'
      title = `${name2} câștigă!`
      subtitle = `${vsScores[0]} - ${vsScores[1]}`
    } else {
      emoji = '🤝'
      title = 'Egalitate!'
      subtitle = `${vsScores[0]} - ${vsScores[1]}`
    }
  } else if (isWords) {
    if (score >= 50) {
      emoji = '🧠'
      title = 'Maestru al cuvintelor!'
    } else if (score >= 30) {
      emoji = '🔥'
      title = 'Foarte bine!'
    } else if (score >= 15) {
      emoji = '😏'
      title = 'Nu-i rău!'
    } else {
      emoji = '💪'
      title = 'Mai exersează!'
    }
    subtitle = `${score} puncte · ${wordsFound || 0} cuvinte`
  } else {
    const pct = score / total
    if (pct >= 0.8) {
      emoji = '🧠'
      title = 'Impresionant!'
      subtitle = `${score} din ${total} corecte`
    } else if (pct >= 0.5) {
      emoji = '😏'
      title = 'Nu-i rău, dar nici bine.'
      subtitle = `${score} din ${total} corecte`
    } else if (pct >= 0.2) {
      emoji = '😬'
      title = 'Capcanele te-au prins.'
      subtitle = `${score} din ${total} corecte`
    } else {
      emoji = '💀'
      title = 'Dezastru total.'
      subtitle = `${score} din ${total} corecte`
    }
  }

  return (
    <div className="result">
      <div className="result-content">
        <div className="result-emoji">{emoji}</div>
        <h1 className="result-title">{title}</h1>
        <p className="result-subtitle">{subtitle}</p>

        <div className="result-actions">
          <button className="result-btn primary" onClick={onRestart}>
            Joacă din nou
          </button>
          <button className="result-btn secondary" onClick={onHome}>
            Meniu principal
          </button>
        </div>
      </div>
    </div>
  )
}
