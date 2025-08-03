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

    // method for basic HTML sanitization
    sanitizeHTML(html) {
        const allowedTags = ['strong', 'em', 'u', 'del', 'code', 'br', 'li', 'ol', 'ul', 'h2', 'h3', 'h4', 'a'];
        const allowedAttributes = {
            'a': ['href', 'target', 'rel']
        };

        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remove script tags and other dangerous elements
        const scripts = temp.querySelectorAll('script, iframe, object, embed');
        scripts.forEach(script => script.remove());
        
        return temp.innerHTML;
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
        
        // Format title and question text with markup
        this.questionTitle.innerHTML = `${q.id}. ${this.formatMarkup(q.title)}`;
        this.questionText.innerHTML = this.formatMarkup(q.question);
        this.progress.textContent = `Question ${this.currentQuestion + 1} of ${this.quizData.length}`;
        
        // Clear options container
        this.optionsContainer.innerHTML = '';
        
        // Render options with markup formatting
        q.options.forEach(option => {
            const letter = option.charAt(0);
            const text = option.substring(3);
            const button = document.createElement('button');
            button.className = 'btn-option';
            button.innerHTML = this.formatMarkup(text); // Changed from textContent to innerHTML
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
        const buttonText = button.textContent; // textContent strips HTML tags
        for (const option of currentQ.options) {
            const optionText = option.substring(3);
            // Compare the plain text versions
            if (optionText === buttonText) {
                return option.charAt(0);
            }
        }
        return '';
    }
    
    formatMarkup(text) {
        if (!text) return '';
        
        const formatted = text

            // Headers: ### text -> <h4>text</h4>
            .replace(/^### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/^# (.+)$/gm, '<h2>$1</h2>')

            // Bold formatting: **text** -> <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

            // Italic formatting: *text* -> <em>text</em>
            .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')

            // Code formatting: `text` -> <code>text</code>
            .replace(/`([^`]+?)`/g, '<code>$1</code>')

            // Underline formatting: __text__ -> <u>text</u>
            .replace(/__(.*?)__/g, '<u>$1</u>')

            // Strikethrough formatting: ~~text~~ -> <del>text</del>
            .replace(/~~(.*?)~~/g, '<del>$1</del>')

            // Links: [text](url) -> <a href="url" target="_blank">text</a>
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

            // Simple bullet points: - item -> • item
            .replace(/^- (.+)$/gm, '• $1')

            // Numbered lists: 1. item -> 1. item (keep as is but could be enhanced)
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

            // Wrap consecutive <li> items in <ol>
            .replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, '<ol>$&</ol>')

            // Fix nested ol tags
            .replace(/<\/ol>\s*<ol>/g, '');

            // Line breaks (last to preserve other formatting)
            .replace(/\n/g, '<br>');

            return this.sanitizeHTML(formatted);       
    }

    formatExplanation(explanation) {
        return this.formatMarkup(explanation);
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
    constructor(quizApp) {
        this.supportedParams = ['quiz', 'url', 'file'];
        this.quizApp = quizApp;
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
                // Use QuizParser for XML parsing
                quizData = await QuizParser.parseXMLContent(content);
            } else {
                // Use QuizParser for TXT parsing
                quizData = await QuizParser.parseTXTContent(content);
            }

            // Validate and load the quiz
            if (quizData && quizData.length > 0) {
                // Update the quiz title if provided in URL
                const urlParams = new URLSearchParams(window.location.search);
                const title = urlParams.get('title');
                if (title) {
                    this.quizApp.quizTitle.textContent = decodeURIComponent(title);
                } else {
                    // Try to extract filename for title
                    const filename = this.getFilenameFromURL(url);
                    if (filename) {
                        this.quizApp.quizTitle.textContent = this.quizApp.formatTitle(filename.replace(/\.[^/.]+$/, ""));
                    }
                }

                // Set quiz data and initialize
                this.quizApp.quizData = quizData;
                this.quizApp.currentQuestion = 0;
                this.quizApp.score = 0;
                
                // Hide loading and show quiz
                this.hideURLLoading();
                this.quizApp.fileFormatInfo.classList.add('hidden');
                this.quizApp.quizContent.classList.remove('hidden');
                this.quizApp.results.classList.add('hidden');
                this.quizApp.questionSection.style.display = 'block';
                
                // Render first question
                this.quizApp.renderQuestion();
                
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

    // Get filename from URL
    getFilenameFromURL(url) {
        try {
            const pathname = new URL(url).pathname;
            return pathname.split('/').pop();
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

// Global variables
let quizApp;
let urlQuizLoader;

// Initialize the quiz application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing quiz app...');
    
    quizApp = new QuizApp();
    console.log('QuizApp created:', quizApp);
    
    urlQuizLoader = new URLQuizLoader(quizApp);
    console.log('URLQuizLoader created:', urlQuizLoader);
    
    // Make them globally accessible for debugging
    window.quizApp = quizApp;
    window.urlQuizLoader = urlQuizLoader;
    
    // Check if there's a quiz in the URL parameters
    console.log('Checking for URL quiz...');
    const hasURLQuiz = urlQuizLoader.checkForURLQuiz();
    console.log('URL quiz found:', hasURLQuiz);
    
    // If no URL quiz, show the normal info section
    if (!hasURLQuiz) {
        console.log('No URL quiz, showing info section');
        const infoSection = document.getElementById('file-format-info');
        if (infoSection) {
            infoSection.classList.remove('hidden');
        }
    }
});

// Add this function to create shareable links (called by the Share button)
function createShareableLink() {
    const quizUrl = prompt('Enter the URL of your quiz file:');
    if (quizUrl) {
        const title = prompt('Enter a title for your quiz (optional):');
        const shareableUrl = URLQuizLoader.generateShareableURL(quizUrl, title);
        
        // Copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareableUrl).then(() => {
                alert(`Shareable URL copied to clipboard:\n${shareableUrl}`);
            }).catch(() => {
                alert(`Shareable URL:\n${shareableUrl}`);
            });
        } else {
            alert(`Shareable URL:\n${shareableUrl}`);
        }
    }
}
