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

// URL Quiz Loader functionality
class URLQuizLoader {
    constructor() {
        this.supportedParams = ['quiz', 'url', 'file'];
    }

    // Check if there's a quiz URL parameter on page load
    checkForURLQuiz() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for different parameter names
        const quizUrl = urlParams.get('quiz') || 
                       urlParams.get('url') || 
                       urlParams.get('file');
        
        if (quizUrl) {
            this.loadQuizFromURL(quizUrl);
            return true;
        }
        return false;
    }

    // Load quiz from URL
    async loadQuizFromURL(url) {
        try {
            // Show loading state
            this.showURLLoading(url);
            
            // Validate URL
            if (!this.isValidURL(url)) {
                throw new Error('Invalid URL format');
            }

            // Fetch the quiz file
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch quiz: ${response.status} ${response.statusText}`);
            }

            // Get the content type or infer from URL
            const contentType = response.headers.get('content-type') || '';
            const fileExtension = this.getFileExtension(url);
            
            // Get the text content
            const content = await response.text();
            
            // Determine file type and parse
            let quizData;
            if (contentType.includes('application/json') || fileExtension === 'json') {
                quizData = JSON.parse(content);
            } else if (contentType.includes('application/xml') || contentType.includes('text/xml') || fileExtension === 'xml') {
                quizData = parseXMLQuiz(content);
            } else {
                // Default to text format
                quizData = parseTXTQuiz(content);
            }

            // Validate and load the quiz
            if (quizData && quizData.length > 0) {
                // Update the quiz title if provided in URL
                const urlParams = new URLSearchParams(window.location.search);
                const title = urlParams.get('title');
                if (title) {
                    document.getElementById('quiz-title').textContent = decodeURIComponent(title);
                }

                // Load the quiz using existing functionality
                loadQuiz(quizData);
                this.hideURLLoading();
                
                // Show success message
                this.showURLSuccess(url);
            } else {
                throw new Error('No valid quiz questions found in the file');
            }

        } catch (error) {
            console.error('Error loading quiz from URL:', error);
            this.showURLError(error.message, url);
        }
    }

    // Validate URL format
    isValidURL(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    // Get file extension from URL
    getFileExtension(url) {
        try {
            const pathname = new URL(url).pathname;
            return pathname.split('.').pop().toLowerCase();
        } catch (_) {
            return '';
        }
    }

    // Show loading state for URL quiz
    showURLLoading(url) {
        const loader = document.getElementById('quiz-loader');
        const infoSection = document.getElementById('file-format-info');
        
        if (loader && infoSection) {
            // Update loader text
            const loaderText = loader.querySelector('p');
            if (loaderText) {
                loaderText.textContent = `Loading quiz from URL...`;
            }
            
            // Add URL info
            const urlInfo = document.createElement('div');
            urlInfo.id = 'url-info';
            urlInfo.style.marginTop = '10px';
            urlInfo.style.fontSize = '12px';
            urlInfo.style.color = '#666';
            urlInfo.style.wordBreak = 'break-all';
            urlInfo.textContent = url;
            loader.appendChild(urlInfo);
            
            loader.classList.remove('hidden');
            infoSection.classList.add('hidden');
        }
    }

    // Hide URL loading state
    hideURLLoading() {
        const loader = document.getElementById('quiz-loader');
        const urlInfo = document.getElementById('url-info');
        
        if (loader) {
            loader.classList.add('hidden');
        }
        
        if (urlInfo) {
            urlInfo.remove();
        }
    }

    // Show success message
    showURLSuccess(url) {
        // Optional: Show a brief success notification
        console.log(`Quiz loaded successfully from: ${url}`);
        
        // Update browser history to clean URL (optional)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('quiz') || urlParams.has('url') || urlParams.has('file')) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    // Show error message
    showURLError(message, url) {
        this.hideURLLoading();
        
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const infoSection = document.getElementById('file-format-info');
        
        if (errorDiv && errorText) {
            errorText.innerHTML = `
                <strong>Failed to load quiz from URL:</strong><br>
                <code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-size: 12px; word-break: break-all;">${url}</code><br><br>
                <strong>Error:</strong> ${message}<br><br>
                Please check that:
                <ul style="text-align: left; margin-top: 10px;">
                    <li>The URL is accessible and returns a valid quiz file</li>
                    <li>The server allows CORS requests (cross-origin resource sharing)</li>
                    <li>The file format is supported (JSON, XML, or TXT)</li>
                </ul>
            `;
            
            errorDiv.classList.remove('hidden');
            infoSection.classList.add('hidden');
        }
    }

    // Generate shareable URL
    static generateShareableURL(quizUrl, title = null) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('quiz', quizUrl);
        if (title) {
            params.set('title', title);
        }
        
        return `${baseUrl}?${params.toString()}`;
    }
}

// Initialize URL quiz loader
const urlQuizLoader = new URLQuizLoader();

// Check for URL quiz when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a quiz in the URL parameters
    const hasURLQuiz = urlQuizLoader.checkForURLQuiz();
    
    // If no URL quiz, show the normal info section
    if (!hasURLQuiz) {
        const infoSection = document.getElementById('file-format-info');
        if (infoSection) {
            infoSection.classList.remove('hidden');
        }
    }
});

// Add this function to create shareable links (optional feature)
function createShareableLink() {
    const quizUrl = prompt('Enter the URL of your quiz file:');
    if (quizUrl) {
        const title = prompt('Enter a title for your quiz (optional):');
        const shareableUrl = URLQuizLoader.generateShareableURL(quizUrl, title);
        
        // Copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareableUrl).then(() => {
                alert(`Shareable URL copied to clipboard:\n${shareableUrl}`);
            });
        } else {
            alert(`Shareable URL:\n${shareableUrl}`);
        }
    }
}
// Initialize the quiz application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
