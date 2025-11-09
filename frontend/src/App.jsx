import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Reading from './components/Reading';
import Quiz from './components/Quiz';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [allReadingsCompleted, setAllReadingsCompleted] = useState(false);

  useEffect(() => {
    fetchReading();
  }, []);

  const fetchReading = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/reading/a1`);
      if (response.data.message) {
        setAllReadingsCompleted(true);
      } else {
        setReading(response.data);
        fetchQuestions(response.data.id);
      }
    } catch (error) {
      console.error('Error fetching reading:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (readingId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/${readingId}`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleQuizSubmit = async (answers) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/submit`, {
        readingId: reading.id,
        answers: answers,
      });
      setResults(response.data);
      setQuizSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleNextReading = () => {
    // Reset all states for the next round
    setReading(null);
    setQuestions([]);
    setQuizSubmitted(false);
    setResults(null);
    setAllReadingsCompleted(false);
    fetchReading(); // Fetch the next reading
  };

  if (loading) {
    return <div className="loading-message">Loading a new story for you...</div>;
  }

  return (
    <div className="App">
      <div className="header">
        <h1>German Reading for Mira!</h1>
      </div>

      {allReadingsCompleted ? (
        <div className="completion-message">
          <h2>Congratulations! ✨</h2>
          <p>You have completed all the A1 level readings. You are amazing!</p>
        </div>
      ) : (
        <>
          {reading && <Reading title={reading.title} text={reading.text} />}
          
          {quizSubmitted && results && (
            <div className="results-container">
              <h2>Your Results!</h2>
              <p className="score">You scored <span>{results.score}</span> out of {results.total}!</p>
            </div>
          )}

          {questions.length > 0 && (
            <Quiz
              questions={questions}
              results={results}
              submitted={quizSubmitted}
              onQuizSubmit={handleQuizSubmit}
            />
          )}

          {quizSubmitted && (
            <div className="action-area">
              <button className="btn" onClick={handleNextReading}>
                Next Reading
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;