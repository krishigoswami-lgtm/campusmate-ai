'use client'

import { useState } from 'react'

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface QuizResponse {
  questions: QuizQuestion[]
}

export default function QuizGeneratorPage() {
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [numQuestions, setNumQuestions] = useState(3)

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:8000/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          num_questions: numQuestions,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate quiz.')

      const data: QuizResponse = await response.json()

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions were generated.')
      }

      setQuestions(data.questions)
      setCurrentQuestion(0)
      setSelectedAnswer('')
      setScore(0)
      setStarted(true)
      setShowResult(false)
    } catch (err) {
      console.error(err)
      setError('Unable to generate quiz. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (answer: string) => {
    if (selectedAnswer) return
    setSelectedAnswer(answer)
    if (answer === questions[currentQuestion].correct_answer) {
      setScore((prev) => prev + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedAnswer('')
    } else {
      setShowResult(true)
    }
  }

  const restartQuiz = () => {
    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer('')
    setScore(0)
    setShowResult(false)
    setStarted(false)
  }

  const getOptionClass = (option: string) => {
    if (!selectedAnswer) return 'option-card'
    if (option === questions[currentQuestion].correct_answer) return 'option-card correct'
    if (option === selectedAnswer) return 'option-card incorrect'
    return 'option-card'
  }

  return (
    <div className="container-wide">
      {!started && !showResult && (
        <>
          <h1>AI Quiz Generator</h1>
          <p className="card-meta" style={{ marginBottom: '1.5rem' }}>
            Generate an AI-powered quiz and test your knowledge.
          </p>

          <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <h2>Quiz Setup</h2>

            <div className="field">
              <label>Topic</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Binary Search Trees"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field">
                <label>Difficulty</label>
                <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="field">
                <label>Number of Questions</label>
                <select className="input" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="btn" style={{ width: 'auto' }} onClick={generateQuiz} disabled={loading}>
              {loading ? 'Generating Quiz...' : 'Generate Quiz'}
            </button>
          </div>
        </>
      )}

      {started && !showResult && questions.length > 0 && (
        <>
          <h1>Quiz</h1>
          <p className="card-meta" style={{ marginBottom: '0.5rem' }}>
            Question {currentQuestion + 1} of {questions.length}
          </p>

          <div className="progress-track" style={{ marginBottom: '1.5rem' }}>
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <h2>{questions[currentQuestion].question}</h2>

            <div>
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className={getOptionClass(option)} onClick={() => selectAnswer(option)}>
                  {option}
                </div>
              ))}
            </div>

            {selectedAnswer && (
              <div style={{ marginTop: '1.25rem' }}>
                <p className="card-meta">
                  <strong>Explanation:</strong> {questions[currentQuestion].explanation}
                </p>
                <button className="btn" style={{ width: 'auto', marginTop: '0.75rem' }} onClick={nextQuestion}>
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'View Results'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showResult && (
        <>
          <h1>Quiz Results</h1>

          <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '1.5rem' }}>
            <h2>Your Score</h2>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              {score} / {questions.length}
            </p>
            <p className="card-meta">
              You answered {score} out of {questions.length} questions correctly.
            </p>
            <button className="btn" style={{ width: 'auto', marginTop: '0.75rem' }} onClick={restartQuiz}>
              Create New Quiz
            </button>
          </div>

          <h2>Review</h2>
          {questions.map((question, index) => (
            <div key={index} className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="card-title">{index + 1}. {question.question}</div>
              <div className="card-meta">Correct answer: {question.correct_answer}</div>
              <div className="card-meta">{question.explanation}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}