import { useState, useEffect, useRef } from 'react'
import Lottie from 'lottie-react'
import confettiAnimation from './animations/confetti.json'
import './App.css'

interface Quote {
  author: string
  citation: string
  source: string
  reference: string
  category: 'rap' | 'author'
}

function App() {
  const [rapQuotes, setRapQuotes] = useState<Quote[]>([])
  const [authorQuotes, setAuthorQuotes] = useState<Quote[]>([])
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const successAudio = useRef(new Audio('/sounds/success.mp3'))
  const errorAudio = useRef(new Audio('/sounds/error.mp3'))

  useEffect(() => {
    const parseCSV = (text: string, category: 'rap' | 'author'): Quote[] => {
      const lines = text.split('\n').filter(line => line.trim())

      return lines.slice(1).map(line => {
        const values = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)?.map(v =>
          v.replace(/^,?"?|"?$/g, '').replace(/""/g, '"')
        ) || []

        return {
          author: values[0] || '',
          citation: values[1] || '',
          source: values[2] || '',
          reference: values[3] || '',
          category
        }
      })
    }

    Promise.all([
      fetch('/data/rap-quotes.csv').then(r => r.text()),
      fetch('/data/author-quotes.csv').then(r => r.text())
    ]).then(([rapText, authorText]) => {
      const rap = parseCSV(rapText, 'rap')
      const authors = parseCSV(authorText, 'author')

      setRapQuotes(rap)
      setAuthorQuotes(authors)
      loadNewQuestion(rap, authors)
    })
  }, [])

  const loadNewQuestion = (rap: Quote[], authors: Quote[]) => {
    if (rap.length === 0 || authors.length === 0) return

    const allQuotes = [...rap, ...authors]
    const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)]

    const oppositeCategory = randomQuote.category === 'rap' ? authors : rap

    const otherAuthors = oppositeCategory.map(q => q.author)
    const uniqueOtherAuthors = [...new Set(otherAuthors)]
    const wrongAnswer = uniqueOtherAuthors[Math.floor(Math.random() * uniqueOtherAuthors.length)]

    const shuffledOptions = [randomQuote.author, wrongAnswer].sort(() => Math.random() - 0.5)

    setCurrentQuote(randomQuote)
    setOptions(shuffledOptions)
    setAnswered(false)
    setSelectedAnswer(null)
  }

  const handleAnswer = (selectedAuthor: string) => {
    if (answered || !currentQuote) return

    setSelectedAnswer(selectedAuthor)
    setAnswered(true)

    if (selectedAuthor === currentQuote.author) {
      setScore(score + 1)
      successAudio.current.play().catch(() => {})
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      errorAudio.current.play().catch(() => {})
    }
  }

  const nextQuestion = () => {
    loadNewQuestion(rapQuotes, authorQuotes)
  }

  if (!currentQuote) {
    return <div className="loading">Chargement des citations...</div>
  }

  return (
    <div className="quiz-container">
      {showConfetti && (
        <div className="confetti-overlay">
          <Lottie animationData={confettiAnimation} loop={false} />
        </div>
      )}

      <div className="header">
        <h1>Quote Clash</h1>
        <div className="score">Score: {score}</div>
      </div>

      <div className="quote-card">
        <p className="quote-text">"{currentQuote.citation}"</p>
      </div>

      <div className="question">
        <h2>Qui est l'auteur de cette citation ?</h2>
      </div>

      <div className="options">
        {options.map((author, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(author)}
            disabled={answered}
            className={`option-button ${
              answered
                ? author === currentQuote.author
                  ? 'correct'
                  : author === selectedAnswer
                  ? 'incorrect'
                  : 'disabled'
                : ''
            }`}
          >
            {author}
          </button>
        ))}
      </div>

      <div className="info-card-container">
        {answered && (
          <div className="info-card">
            <h3>Informations</h3>
            <p><strong>Auteur:</strong> {currentQuote.author}</p>
            <p><strong>{currentQuote.category === 'rap' ? 'Chanson' : 'Oeuvre'}:</strong> {currentQuote.source}</p>
          </div>
        )}
      </div>

      <button onClick={nextQuestion} className="next-button" disabled={!answered}>
        Question suivante
      </button>
    </div>
  )
}

export default App
