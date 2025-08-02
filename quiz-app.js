// quiz-app.js

class QuizApp {
    constructor() {
        this.quizData = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.initializeElements();
        this.attachEventListeners();
    }
    
    initializeElements() {
        // File input elements
        this.fileInput = document.getElementById('quiz-file-input');
        this.loader = document.getElementById('quiz-loader');
        this.fileFormatInfo = document.getElementById('file-format-info');
        
        // Quiz content elements
        this.quizContent = document.getElementById('quiz-content');
        this.quizTitle = document.getElementById('quiz-title');
        this.progress = document.getElementById('progress');
        this.questionTitle = document.getElementById('question-title');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.feedback = document.getElementById('feedback');
        this.explanation = document.getElementById('explanation');
        this.nextBtn = document.getElementById('next-btn');
        
        // Results elements
        this.results = document.getElementById('results');
        this.questionSection = document.getElementById('question-section');
        this.scoreNumber = document.getElementById('score-number');
        this.scorePercentage = document.getElementById('score-percentage');
        this.scoreMessage = document.getElementById('score-message');
        this.restartBtn = document.getElementById('restart-btn');
        this.newQuizBtn = document.getElementById('new-quiz-btn');
        
        // Error elements
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.tryAgainBtn = document.getElementById('try-again-btn');
    }
    
    attachEventListeners() {
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.restartBtn.addEventListener('click', () => this.restartQuiz());
        this.newQuizBtn.addEventListener('click', () => this.loadNewQuiz());
        this.tryAgainBtn.addEventListener('click', () => this.clearError());
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.showLoader();
        
        try {
            this.quizData = await QuizParser.parseFile(file);
            this.initializeQuiz(file.name);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }
    
    initializeQuiz(fileName) {
        this.currentQuestion = 0;
        this.score = 0;
        
        // Update quiz title with file name
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        this.quizTitle.textContent = this.formatTitle(baseName);
        
        // Hide info section and show quiz content
        this.fileFormatInfo.classList.add('hidden');
        this.quizContent.classList.remove('hidden');
        this.results.classList.add('hidden');
        this.questionSection.style.display = 'block';
        
        this.renderQuestion();
    }
    
    formatTitle(fileName) {
        return fileName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            + ' Quiz';
    }
    
    renderQuestion() {
        if (this.currentQuestion >= this.quizData.length) {
            this.showResults();
            return;
        }
        
        const q = this.quizData[this.currentQuestion];
        
        this.questionTitle.textContent = `${q.id}. ${q.title}`;
        this.questionText.textContent = q.question;
        this.progress.textContent = `Question ${this.currentQuestion + 1} of ${this.quizData.length}`;
        
        // Clear options container
        this.optionsContainer.innerHTML = '';
        
        // Render options
        q.options.forEach(option => {
            const letter = option.charAt(0);
            const text = option.substring(3);
            const button = document.createElement('button');
            button.className = 'btn-option';
            button.textContent = text;
            button.addEventListener('click', () => 
                this.handleAnswer(button, letter, q.correct_answer, q.explanation)
            );
            this.optionsContainer.appendChild(button);
        });
        
        // Hide feedback
        this.feedback.classList.add('hidden');
        
        // Reset explanation scroll
        const explanationContainer = document.querySelector('.explanation-container');
        if (explanationContainer) {
            explanationContainer.scrollTop = 0;
        }
    }
    
    handleAnswer(selectedButton, selectedAnswer, correctAnswer, explanation) {
        const isCorrect = selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();
        
        // Disable all option buttons
        const allButtons = this.optionsContainer.querySelectorAll('.btn-option');
        allButtons.forEach(button => {
            button.classList.add('disabled');
            button.disabled = true;
            
            // Find the letter for this button
            const buttonLetter = this.findButtonLetter(button);
            
            if (buttonLetter.toLowerCase() === correctAnswer.toLowerCase()) {
                button.classList.add('correct');
            }
        });
        
        // Mark wrong answer if incorrect
        if (!isCorrect) {
            selectedButton.classList.add('wrong');
        } else {
            this.score++;
        }
        
        // Show explanation
        this.explanation.innerHTML = this.formatExplanation(explanation);
        this.feedback.classList.remove('hidden');
        
        // Update next button text
        this.nextBtn.textContent = 
            this.currentQuestion + 1 === this.quizData.length ? 'Finish Quiz' : 'Next Question';
        
        // Reset explanation scroll
        const explanationContainer = document.querySelector('.explanation-container');
        if (explanationContainer) {
            explanationContainer.scrollTop = 0;
        }
    }
    
    findButtonLetter(button) {
        const currentQ = this.quizData[this.currentQuestion];
        for (const option of currentQ.options) {
            if (option.substring(3) === button.textContent) {
                return option.charAt(0);
            }
        }
        return '';
    }
    
    formatExplanation(explanation) {
        return explanation.replace(/\n/g, '<br>');
    }
    
    nextQuestion() {
        this.currentQuestion++;
        if (this.currentQuestion < this.quizData.length) {
            this.renderQuestion();
        } else {
            this.showResults();
        }
    }
    
    showResults() {
        this.questionSection.style.display = 'none';
        this.results.classList.remove('hidden');
        
        const percentage = Math.round((this.score / this.quizData.length) * 100);
        
        this.scoreNumber.textContent = `${this.score} / ${this.quizData.length}`;
        this.scorePercentage.textContent = `${percentage}%`;
        
        // Generate score message
        let message = '';
        if (percentage >= 90) {
            message = 'Outstanding! You have excellent knowledge of this topic! 🎉';
        } else if (percentage >= 80) {
            message = 'Great job! You have very good understanding of this subject! 👏';
        } else if (percentage >= 70) {
            message = 'Good work! You have solid knowledge with room for improvement. 👍';
        } else if (percentage >= 60) {
            message = 'Not bad! Review the explanations to strengthen your understanding. 📖';
        } else {
            message = 'Keep studying! Review the explanations and try again to improve your knowledge. 📚';
        }
        
        this.scoreMessage.textContent = message;
    }
    
    restartQuiz() {
        this.currentQuestion = 0;
        this.score = 0;
        this.questionSection.style.display = 'block';
        this.results.classList.add('hidden');
        this.renderQuestion();
    }
    
    loadNewQuiz() {
        // Reset quiz state
        this.quizData = [];
        this.currentQuestion = 0;
        this.score = 0;
        
        // Reset file input
        this.fileInput.value = '';
        
        // Show file selection interface
        this.quizContent.classList.add('hidden');
        this.results.classList.add('hidden');
        this.fileFormatInfo.classList.remove('hidden');
        this.quizTitle.textContent = 'Quiz Application';
        
        this.clearError();
    }
    
    showLoader() {
        this.loader.classList.remove('hidden');
        this.fileFormatInfo.classList.add('hidden');
        this.quizContent.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
    }
    
    hideLoader() {
        this.loader.classList.add('hidden');
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.fileFormatInfo.classList.add('hidden');
        this.quizContent.classList.add('hidden');
    }
    
    clearError() {
        this.errorMessage.classList.add('hidden');
        this.fileFormatInfo.classList.remove('hidden');
    }
}

// Initialize the quiz application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
