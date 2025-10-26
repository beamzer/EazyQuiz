// quiz-app.js
// Main controller for the interactive quiz application.

class QuizApp {
    constructor() {
        this.quizData = [];         // Parsed quiz questions
        this.currentQuestion = 0;   // Index of the question being displayed
        this.score = 0;             // User's running score
        this.language = 'en';       // Default language
        this.translations = {};     // Language translations
        this.initializeElements();
        this.attachEventListeners();
        this.initializeLanguage();
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
        this.explanationHeading = document.getElementById('explanation-heading');
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

    // Initialize language support
    async initializeLanguage() {
        // Check URL parameters for language
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang') || urlParams.get('language');
        
        if (langParam) {
            this.language = langParam.toLowerCase();
        }
        
        // Load language file
        await this.loadLanguage(this.language);
    }

    // Load language translations
    async loadLanguage(lang) {
        try {
            const response = await fetch(`languages/${lang}.json`);
            if (!response.ok) {
                // Fallback to English if language file not found
                if (lang !== 'en') {
                    console.warn(`Language file for '${lang}' not found, falling back to English`);
                    return this.loadLanguage('en');
                }
                throw new Error(`Failed to load language file: ${response.status}`);
            }
            
            this.translations = await response.json();
            this.language = lang;
            
            // Update UI with new language
            this.updateUILanguage();
        } catch (error) {
            console.error('Error loading language:', error);
            // Use English as fallback
            if (lang !== 'en') {
                this.loadLanguage('en');
            }
        }
    }

    // Get translated text
    t(key, replacements = {}) {
        let text = this.translations[key] || key;
        
        // Handle nested keys like scoreMessages.excellent
        if (key.includes('.')) {
            const keys = key.split('.');
            let current = this.translations;
            for (const k of keys) {
                current = current[k];
                if (!current) break;
            }
            text = current || key;
        }
        
        // Replace placeholders
        Object.keys(replacements).forEach(placeholder => {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        });
        
        return text;
    }

    // Update UI elements with current language
    updateUILanguage() {
        // Update static text elements
        const restartBtn = document.getElementById('restart-btn');
        const newQuizBtn = document.getElementById('new-quiz-btn');
        const tryAgainBtn = document.getElementById('try-again-btn');
        
        if (restartBtn) restartBtn.textContent = this.t('restart');
        if (newQuizBtn) newQuizBtn.textContent = this.t('newQuiz');
        if (tryAgainBtn) tryAgainBtn.textContent = this.t('tryAgain');
        
        // Update explanation heading
        if (this.explanationHeading) {
            this.explanationHeading.textContent = this.t('explanation');
        }
        
        // Update results heading
        const resultsHeading = document.getElementById('results-heading');
        if (resultsHeading) {
            resultsHeading.textContent = this.t('results');
        }
        
        // Update loader text
        const loaderText = document.querySelector('#quiz-loader p');
        if (loaderText) loaderText.textContent = this.t('loading');
    }

    // Sanitize raw HTML/markdown to prevent XSS while allowing safe formatting tags.
    sanitizeHTML(html) {
        const allowedTags = ['strong', 'em', 'u', 'del', 'code', 'br', 'li', 'ol', 'ul', 'h2', 'h3', 'h4', 'a', 'b'];
        const allowedAttributes = {
            'a': ['href', 'target', 'rel']
        };
        
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remove script tags and other dangerous elements
        const scripts = temp.querySelectorAll('script, iframe, object, embed, style');
        scripts.forEach(script => script.remove());
        
        // Remove any tags not in allowedTags
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(element => {
            if (!allowedTags.includes(element.tagName.toLowerCase())) {
                // Replace the element with its text content
                element.replaceWith(document.createTextNode(element.textContent));
            } else {
                // Remove any attributes not in allowedAttributes
                const tagName = element.tagName.toLowerCase();
                const allowedAttrs = allowedAttributes[tagName] || [];
                const attrs = Array.from(element.attributes);
                attrs.forEach(attr => {
                    if (!allowedAttrs.includes(attr.name)) {
                        element.removeAttribute(attr.name);
                    }
                });
            }
        });
        
        return temp.innerHTML;
    }
    
    // Handle local file upload; parse and validate the selected quiz file.
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.showLoader(); // Display loading spinner
        
        try {
            this.quizData = await QuizParser.parseFile(file);
            this.initializeQuiz(file.name);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }
    
    // Set up the quiz UI and state after a file has been successfully parsed.
    initializeQuiz(fileName) {
        this.currentQuestion = 0;
        this.score = 0;
        
        // Derive a friendly title from the filename
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        this.quizTitle.textContent = this.formatTitle(baseName);

        // Hide the Load Quiz button when quiz is active
        document.querySelector('.file-btn').style.display = 'none';
        
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
    
    // Display the current question and its multiple-choice options.
    renderQuestion() {
        if (this.currentQuestion >= this.quizData.length) {
            this.showResults();
            return;
        }
        
        const q = this.quizData[this.currentQuestion];
        
        // Format title and question text with markup
        this.questionTitle.innerHTML = `${q.id}. ${this.formatMarkup(q.title)}`;
        this.questionText.innerHTML = this.formatMarkup(q.question);
        this.progress.textContent = this.t('progress', {
            current: this.currentQuestion + 1,
            total: this.quizData.length
        });
        
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
        
        // Reset explanation scroll and setup scroll detection
        const explanationContainer = document.querySelector('.explanation-container');
        if (explanationContainer) {
            explanationContainer.scrollTop = 0;
            this.setupScrollDetection(explanationContainer);
        }
    }
    
    // Process the user's selected answer, provide feedback, and show explanation.
    handleAnswer(selectedButton, selectedAnswer, correctAnswer, explanation) {
        const isCorrect = selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();
        
        // Disable all option buttons to prevent multiple selections
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
            this.currentQuestion + 1 === this.quizData.length ? this.t('finishQuiz') : this.t('nextQuestion');
        
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
        
        let formatted = text
            // Headers: ### text -> <h4>text</h4>
            .replace(/^### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/^# (.+)$/gm, '<h2>$1</h2>')

            // Bold formatting: **text** -> <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            //.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

            // Italic formatting: *text* -> <em>text</em>
            .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')

            // Code formatting: `text` -> <code>text</code>
            .replace(/`([^`]+?)`/g, '<code>$1</code>')

            // Underline formatting: __text__ -> <u>text</u>
            .replace(/__(.*?)__/g, '<u>$1</u>')

            // Strikethrough formatting: ~~text~~ -> <del>text</del>
            .replace(/~~(.*?)~~/g, '<del>$1</del>')

            // Links: [text](url) -> <a href="url" target="_blank">text</a>
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Handle lists more carefully
        // Split into lines for better list processing
        const lines = formatted.split('\n');
        const processedLines = [];
        let inBulletList = false;
        let inNumberedList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const isBulletItem = /^-\s+(.+)$/.test(line);
            const isNumberedItem = /^\d+\.\s+(.+)$/.test(line);

            if (isBulletItem) {
                if (!inBulletList) {
                    if (inNumberedList) {
                        processedLines.push('</ol>');
                        inNumberedList = false;
                    }
                    processedLines.push('<ul>');
                    inBulletList = true;
                }
                const match = line.match(/^-\s+(.+)$/);
                processedLines.push(`<li>${match[1]}</li>`);
            } else if (isNumberedItem) {
                if (!inNumberedList) {
                    if (inBulletList) {
                        processedLines.push('</ul>');
                        inBulletList = false;
                    }
                    processedLines.push('<ol>');
                    inNumberedList = true;
                }
                const match = line.match(/^\d+\.\s+(.+)$/);
                processedLines.push(`<li>${match[1]}</li>`);
            } else {
                // Not a list item
                if (inBulletList) {
                    processedLines.push('</ul>');
                    inBulletList = false;
                }
                if (inNumberedList) {
                    processedLines.push('</ol>');
                    inNumberedList = false;
                }
                
                // Only add non-empty lines as regular content
                if (line) {
                    processedLines.push(line);
                }
            }
        }

        // Close any open lists
        if (inBulletList) {
            processedLines.push('</ul>');
        }
        if (inNumberedList) {
            processedLines.push('</ol>');
        }

        // Join back but handle line breaks more carefully
        formatted = processedLines.join('\n');
        
        // Convert line breaks to <br> but avoid adding them inside lists
        formatted = formatted.replace(/\n(?![<\/]?[uo]l>|<li>|<\/li>)/g, '<br>');
        
        // Clean up any remaining newlines around list elements
        formatted = formatted
            .replace(/\n(<\/?[uo]l>)/g, '$1')
            .replace(/(<\/?[uo]l>)\n/g, '$1')
            .replace(/\n(<\/?li>)/g, '$1')
            .replace(/(<\/?li>)\n/g, '$1');

        return this.sanitizeHTML(formatted);       
    }

    formatExplanation(explanation) {
        return this.formatMarkup(explanation);
    }
    
    // Setup scroll detection for explanation container
    setupScrollDetection(container) {
        // Remove existing scroll indicator if present
        const existingIndicator = container.querySelector('.scroll-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Check if content is scrollable
        const isScrollable = container.scrollHeight > container.clientHeight;
        
        if (isScrollable) {
            // Add scroll indicator
            const scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            scrollIndicator.textContent = '↓ ' + this.t('scrollForMore');
            container.appendChild(scrollIndicator);
            
            // Add scroll detection class
            container.classList.add('has-scroll');
            container.classList.remove('scrolled-to-bottom');
            
            // Add scroll event listener
            const scrollHandler = () => {
                const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
                
                if (isAtBottom) {
                    container.classList.add('scrolled-to-bottom');
                } else {
                    container.classList.remove('scrolled-to-bottom');
                }
            };
            
            // Remove existing listeners to prevent duplicates
            container.removeEventListener('scroll', container._scrollHandler);
            container._scrollHandler = scrollHandler;
            container.addEventListener('scroll', scrollHandler);
            
        } else {
            // Content fits, remove scroll classes
            container.classList.remove('has-scroll', 'scrolled-to-bottom');
        }
    }
    
    nextQuestion() {
        this.currentQuestion++;
        if (this.currentQuestion < this.quizData.length) {
            this.renderQuestion();
        } else {
            this.showResults();
        }
    }
    
    // Display final score, percentage, and a tailored message.
    showResults() {
        this.questionSection.style.display = 'none';
        this.results.classList.remove('hidden');
        
        const percentage = Math.round((this.score / this.quizData.length) * 100);
        
        this.scoreNumber.textContent = `${this.score} / ${this.quizData.length}`;
        this.scorePercentage.textContent = `${percentage}%`;
        
        // Generate score message
        let messageKey = '';
        if (percentage >= 90) {
            messageKey = 'scoreMessages.excellent';
        } else if (percentage >= 80) {
            messageKey = 'scoreMessages.veryGood';
        } else if (percentage >= 70) {
            messageKey = 'scoreMessages.good';
        } else if (percentage >= 60) {
            messageKey = 'scoreMessages.fair';
        } else {
            messageKey = 'scoreMessages.poor';
        }
        
        this.scoreMessage.textContent = this.t(messageKey);
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

        // Show the Load Quiz button again
        document.querySelector('.file-btn').style.display = 'inline-block';
        
        // Show file selection interface
        this.quizContent.classList.add('hidden');
        this.results.classList.add('hidden');
        this.fileFormatInfo.classList.remove('hidden');
        this.quizTitle.textContent = this.t('quiz') + ' Application';
        
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
// Loads quizzes directly from external URLs via URL parameters.
class URLQuizLoader {
    constructor(quizApp) {
        this.supportedParams = ['quiz', 'url', 'file', 'lang', 'language'];
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

                // Hide the Load Quiz button when quiz is loaded via URL
                document.querySelector('.file-btn').style.display = 'none';
                
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
                loaderText.textContent = this.quizApp.t('loading');
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
    static generateShareableURL(quizUrl, title = null, language = null) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('quiz', quizUrl);
        if (title) {
            params.set('title', title);
        }
        if (language && language !== 'en') {
            params.set('lang', language);
        }
        
        return `${baseUrl}?${params.toString()}`;
    }
}

// Global variables
let quizApp;
let urlQuizLoader;

// Initialize the quiz application when the DOM is fully loaded.
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
