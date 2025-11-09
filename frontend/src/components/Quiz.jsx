import React, { useState } from 'react';

const Quiz = ({ questions, results, submitted, onQuizSubmit }) => {
  const [answers, setAnswers] = useState({});
  const optionLetters = ['a', 'b', 'c', 'd']; // For lettering the options

  const handleOptionChange = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onQuizSubmit(answers);
  };

  const getLabelClass = (questionId, option) => {
    if (!submitted) return '';
    
    const resultInfo = results.results[questionId];
    const isCorrectAnswer = option === resultInfo.correct_answer;
    const isUserAnswer = option === resultInfo.user_answer;

    if (isCorrectAnswer) return 'correct';
    if (isUserAnswer && !resultInfo.is_correct) return 'user-incorrect';
    return 'incorrect';
  };
  
  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredQuestions === totalQuestions;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h3>Quiz</h3>
        {!submitted && (
          <div className="progress-counter">
            {answeredQuestions} / {totalQuestions} Answered
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        {questions.map((q, questionIndex) => (
          <div key={q.id} className="question">
            {/* --- CHANGE 1: Added question number --- */}
            <p>
              <span className="question-number">{questionIndex + 1}.</span>
              {q.id > 5 ? `"${q.word}" means:` : q.question}
            </p>
            <div className="options">
              {q.options.map((option, optionIndex) => (
                <div key={option}>
                  <input
                    type="radio"
                    id={`${q.id}-${option}`}
                    name={q.id}
                    value={option}
                    onChange={() => handleOptionChange(q.id, option)}
                    checked={answers[q.id] === option}
                    disabled={submitted}
                  />
                  <label
                    htmlFor={`${q.id}-${option}`}
                    className={submitted ? getLabelClass(q.id, option) : ''}
                  >
                    {/* --- CHANGE 2: Added option letter --- */}
                    <span className="option-letter">{optionLetters[optionIndex]}.</span>
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!submitted && (
          <div className="action-area">
            <button type="submit" className="btn" disabled={!allAnswered}>
              Submit Answers
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Quiz;