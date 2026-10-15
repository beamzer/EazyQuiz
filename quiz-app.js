// quiz-app.js
// Main controller for the interactive quiz application.

class QuizApp {
    constructor() {
        this.quizData = [];         // Parsed quiz questions
        this.currentQuestion = 0;   // Index of the question being displayed
        this.score = 0;             // User's running score
        this.language = 'en';       // Default language
        this.translations = {};     // Language translations
        this.showPrizeDraw = false; // Default to not showing prize draw
        this.quizName = '';         // Identifier of the loaded quiz (sent with prize draw entry)
        this.registered = false;    // True once this browser registered for the prize draw
        this.registerEndpoint = 'register.php';
        this.EXPLANATION_DELAY_MS = 1000; // pause before the explanation appears
        this.feedbackTimer = null;
        this.typingFrame = null;
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
        this.progressWrap = document.getElementById('progress-wrap');
        this.progressFill = document.getElementById('progress-fill');
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
        // Check URL parameters for language and prize draw
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang') || urlParams.get('language');
        const prizeDrawParam = urlParams.get('prizeDraw') || urlParams.get('prize');
        
        if (langParam && /^[a-z]{2}(-[a-z]{2})?$/i.test(langParam)) {
            this.language = langParam.toLowerCase();
        }
        
        // Set prize draw visibility (default to true if not specified)
        if (prizeDrawParam !== null) {
            this.showPrizeDraw = prizeDrawParam.toLowerCase() === 'true';
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
            document.documentElement.lang = lang;
            
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

    // Get translated text; supports nested keys (scoreMessages.excellent) and {placeholders}
    t(key, replacements = {}) {
        let text = key.split('.').reduce(
            (obj, k) => (obj && typeof obj === 'object' ? obj[k] : undefined),
            this.translations
        );
        if (typeof text !== 'string') text = key;

        Object.keys(replacements).forEach(placeholder => {
            text = text.split(`{${placeholder}}`).join(replacements[placeholder]);
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

    // Sanitize HTML to prevent XSS while allowing safe formatting tags.
    // Parsed with DOMParser so nothing (e.g. <img onerror>) executes while sanitizing.
    sanitizeHTML(html) {
        const allowedTags = new Set(['strong', 'em', 'u', 'del', 'code', 'br', 'li', 'ol', 'ul', 'h2', 'h3', 'h4', 'a', 'b', 'div']);
        const calloutClasses = new Set(['callout ok', 'callout bad', 'callout tip', 'callout warn', 'callout fact']);
        const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');

        const clean = (node) => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) return;
                if (child.nodeType !== Node.ELEMENT_NODE) {
                    child.remove();
                    return;
                }
                const tag = child.tagName.toLowerCase();
                if (!allowedTags.has(tag)) {
                    // Drop the element; keep only its text (dangerous elements: drop entirely)
                    const dangerous = ['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript'];
                    child.replaceWith(dangerous.includes(tag)
                        ? document.createTextNode('')
                        : document.createTextNode(child.textContent));
                    return;
                }
                Array.from(child.attributes).forEach(attr => {
                    const keep = (tag === 'a' && attr.name === 'href') ||
                        (tag === 'div' && attr.name === 'class' && calloutClasses.has(attr.value));
                    if (!keep) {
                        child.removeAttribute(attr.name);
                    }
                });
                if (tag === 'a') {
                    const href = child.getAttribute('href') || '';
                    let safe = false;
                    try {
                        const u = new URL(href, window.location.href);
                        safe = ['http:', 'https:', 'mailto:'].includes(u.protocol);
                    } catch (_) { /* invalid URL */ }
                    if (safe) {
                        child.setAttribute('target', '_blank');
                        child.setAttribute('rel', 'noopener noreferrer');
                    } else {
                        child.removeAttribute('href');
                    }
                }
                clean(child);
            });
        };

        clean(doc.body);
        return doc.body.innerHTML;
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
        this.quizName = baseName;
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
    
    // Fisher-Yates shuffle; returns a new array
    shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
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
        
        this.progressWrap.classList.remove('hidden');
        this.progressFill.style.width = `${(this.currentQuestion / this.quizData.length) * 100}%`;
        if (this.currentQuestion > 0) {
            this.questionTitle.focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Clear options container
        this.optionsContainer.innerHTML = '';
        
        // Render options in random order; the letters stay attached to the options
        this.shuffle(q.options).forEach(option => {
            const button = document.createElement('button');
            button.className = 'btn-option';
            button.dataset.key = option.key;
            button.innerHTML = this.formatMarkup(option.text);
            button.addEventListener('click', () =>
                this.handleAnswer(button, option.key, q.correct_answer, q.explanation)
            );
            this.optionsContainer.appendChild(button);
        });
        
        this.cancelFeedback();
        this.feedback.classList.add('hidden');
    }
    
    // Small confetti burst from a correct answer (skipped for reduced motion)
    celebrate(button) {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        const colors = ['#00778a', '#f07a14', '#e30613', '#1b7a3a', '#003741', '#f2c200'];
        const pieces = [];
        for (let i = 0; i < 18; i++) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            piece.setAttribute('aria-hidden', 'true');
            const angle = (-90 + (Math.random() - 0.5) * 160) * Math.PI / 180;
            const distance = 60 + Math.random() * 90;
            piece.style.background = colors[i % colors.length];
            piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
            piece.style.setProperty('--dy', `${Math.sin(angle) * distance + 30}px`);
            piece.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 720)}deg`);
            button.appendChild(piece);
            pieces.push(piece);
        }
        setTimeout(() => pieces.forEach(p => p.remove()), 1000);
    }

    // Process the user's selected answer, provide feedback, and show explanation.
    handleAnswer(selectedButton, selectedAnswer, correctAnswer, explanation) {
        const isCorrect = selectedAnswer === correctAnswer;
        
        // Disable all option buttons to prevent multiple selections
        const allButtons = this.optionsContainer.querySelectorAll('.btn-option');
        allButtons.forEach(button => {
            button.classList.add('disabled');
            button.disabled = true;
            
            if (button.dataset.key === correctAnswer) {
                button.classList.add('correct');
            }
        });
        
        // Mark wrong answer if incorrect
        if (!isCorrect) {
            selectedButton.classList.add('wrong');
        } else {
            this.score++;
            this.celebrate(selectedButton);
        }
        
        // Update next button text
        this.nextBtn.textContent = 
            this.currentQuestion + 1 === this.quizData.length ? this.t('finishQuiz') : this.t('nextQuestion');
        
        // Let the answer indication sink in before the explanation appears
        const html = this.formatExplanation(explanation || this.t('noExplanation'));
        this.cancelFeedback();
        this.feedbackTimer = setTimeout(() => this.showExplanation(html), this.EXPLANATION_DELAY_MS);
    }

    // Show the feedback block and build the explanation up gradually.
    showExplanation(html) {
        this.explanation.innerHTML = html;
        this.feedback.classList.remove('hidden');

        // Bring the explanation and the Next button into view
        this.nextBtn.focus({ preventScroll: true });
        this.feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const walker = document.createTreeWalker(this.explanation, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        const texts = nodes.map(n => n.nodeValue);
        const total = texts.reduce((sum, t) => sum + t.length, 0);
        if (reduceMotion || total === 0) return;

        // Keep the final height so the layout (and the Next button) does not jump while typing
        const container = this.explanation.closest('.explanation-container');
        container.style.minHeight = `${container.offsetHeight}px`;
        nodes.forEach(n => { n.nodeValue = ''; });
        this.explanation.setAttribute('aria-busy', 'true');

        // Fast: roughly 125 characters per second, between 0.6 and 2.5 seconds in total
        const duration = Math.min(2500, Math.max(600, total * 8));
        const start = performance.now();
        const step = (now) => {
            let remaining = Math.floor(((now - start) / duration) * total);
            for (let i = 0; i < nodes.length; i++) {
                const len = texts[i].length;
                nodes[i].nodeValue = texts[i].slice(0, Math.max(0, Math.min(len, remaining)));
                remaining -= len;
            }
            if (now - start < duration) {
                this.typingFrame = requestAnimationFrame(step);
            } else {
                this.finishExplanation(nodes, texts);
            }
        };
        this.typingFrame = requestAnimationFrame(step);
    }

    finishExplanation(nodes, texts) {
        nodes.forEach((n, i) => { n.nodeValue = texts[i]; });
        this.explanation.removeAttribute('aria-busy');
        const container = this.explanation.closest('.explanation-container');
        if (container) container.style.minHeight = '';
    }

    // Stop a pending or running explanation reveal
    cancelFeedback() {
        clearTimeout(this.feedbackTimer);
        cancelAnimationFrame(this.typingFrame);
        this.feedbackTimer = null;
        this.typingFrame = null;
        this.explanation.removeAttribute('aria-busy');
        const container = this.explanation.closest('.explanation-container');
        if (container) container.style.minHeight = '';
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
            const callout = line.match(/^\[(ok|bad|tip|warn|fact)\]\s*(.+)$/i);
            if (callout) {
                if (inBulletList) { processedLines.push('</ul>'); inBulletList = false; }
                if (inNumberedList) { processedLines.push('</ol>'); inNumberedList = false; }
                processedLines.push(`<div class="callout ${callout[1].toLowerCase()}">${callout[2]}</div>`);
                continue;
            }
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
        
        // Drop newlines around block elements, then turn the remaining ones into <br>
        formatted = formatted
            .replace(/\n*(<\/?(?:ul|ol|li|h[2-4])>|<div class="callout \w+">|<\/div>)\n*/g, '$1')
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
    
    // Display final score, percentage, and a tailored message.
    showResults() {
        this.questionSection.style.display = 'none';
        this.progressWrap.classList.add('hidden');
        this.results.classList.remove('hidden');
        
        const percentage = Math.round((this.score / this.quizData.length) * 100);
        this.scorePercentage.style.setProperty('--pct', percentage);
        
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
        
        // Add prize draw section
        this.addPrizeDrawSection();
    }
    
    // Add prize draw registration form to the results
    addPrizeDrawSection() {
        if (!this.showPrizeDraw || document.getElementById('prize-draw-section')) {
            return;
        }

        const section = document.createElement('div');
        section.id = 'prize-draw-section';
        section.className = 'prize-draw';

        const description = document.createElement('p');
        description.textContent = this.t('prizeDrawDescription');
        section.appendChild(description);

        if (this.registered || this.hasRegisteredBefore()) {
            this.registered = true;
            description.textContent = this.t('prizeDrawDone');
            this.results.appendChild(section);
            return;
        }

        const form = document.createElement('form');
        form.noValidate = false;

        const input = document.createElement('input');
        input.type = 'email';
        input.required = true;
        input.autocomplete = 'email';
        input.id = 'prize-email';
        input.placeholder = this.t('prizeDrawEmailPlaceholder');
        input.setAttribute('aria-label', this.t('prizeDrawEmail'));

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'btn';
        submit.textContent = this.t('prizeDraw');

        const status = document.createElement('p');
        status.className = 'prize-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');

        form.append(input, submit);
        section.append(form, status);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submit.disabled = true;
            status.textContent = '';
            const result = await this.registerForPrizeDraw(input.value.trim());
            if (result === 'ok' || result === 'duplicate') {
                this.registered = true;
                this.rememberRegistration();
                form.remove();
                description.textContent = this.t(result === 'ok' ? 'prizeDrawDone' : 'prizeDrawDuplicate');
            } else {
                status.textContent = this.t(result === 'invalid' ? 'prizeDrawInvalid' : 'prizeDrawError');
                submit.disabled = false;
            }
        });

        this.results.appendChild(section);
    }

    // POST the entry to the registration endpoint.
    // Returns 'ok' | 'duplicate' | 'invalid' | 'error'
    async registerForPrizeDraw(email) {
        try {
            const response = await fetch(this.registerEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    score: this.score,
                    total: this.quizData.length,
                    quiz: this.quizName
                })
            });
            if (response.status === 409) return 'duplicate';
            if (response.status === 400 || response.status === 422) return 'invalid';
            return response.ok ? 'ok' : 'error';
        } catch (error) {
            console.error('Prize draw registration failed:', error);
            return 'error';
        }
    }

    // Convenience only: the server is the real duplicate check.
    hasRegisteredBefore() {
        try {
            return localStorage.getItem('eazyquiz-registered:' + this.quizName) === '1';
        } catch (_) {
            return false;
        }
    }

    rememberRegistration() {
        try {
            localStorage.setItem('eazyquiz-registered:' + this.quizName, '1');
        } catch (_) { /* storage unavailable */ }
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
// Loads quizzes (hosted on the same server) via URL parameters.
class URLQuizLoader {
    constructor(quizApp) {
        this.supportedParams = ['quiz', 'url', 'file', 'lang', 'language', 'prizeDraw', 'prize'];
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
            
            // Only quiz files hosted on this server are loaded
            const resolved = this.resolveQuizURL(url);
            if (!resolved) {
                throw new Error('Quiz files must be hosted on the same server as this page');
            }

            const response = await fetch(resolved.href);
            if (!response.ok) {
                throw new Error(`Failed to fetch quiz: ${response.status} ${response.statusText}`);
            }

            const extension = this.getFileExtension(resolved.href);
            const content = await response.text();
            const quizData = QuizParser.parse(content, extension === 'json' || extension === 'xml' ? extension : 'txt');

            // Load the quiz
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
            this.quizApp.quizName = this.getFilenameFromURL(resolved.href).replace(/\.[^/.]+$/, "");
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

        } catch (error) {
            console.error('Error loading quiz from URL:', error);
            this.showURLError(error.message, url);
        }
    }

    // Resolve a (relative or absolute) quiz URL; null unless it is on this origin
    resolveQuizURL(string) {
        try {
            const url = new URL(string, window.location.href);
            return url.origin === window.location.origin ? url : null;
        } catch (_) {
            return null;
        }
    }

    // Get file extension from URL
    getFileExtension(url) {
        try {
            return new URL(url, window.location.href).pathname.split('.').pop().toLowerCase();
        } catch (_) {
            return '';
        }
    }

    // Get filename from URL
    getFilenameFromURL(url) {
        try {
            return new URL(url, window.location.href).pathname.split('/').pop();
        } catch (_) {
            return '';
        }
    }

    // Show loading state for URL quiz
    showURLLoading(url) {
        const loader = document.getElementById('quiz-loader');
        const infoSection = document.getElementById('file-format-info');
        if (!loader || !infoSection) return;

        const loaderText = loader.querySelector('p');
        if (loaderText) {
            loaderText.textContent = this.quizApp.t('loading');
        }

        const urlInfo = document.createElement('div');
        urlInfo.id = 'url-info';
        urlInfo.className = 'url-info';
        urlInfo.textContent = url;
        loader.appendChild(urlInfo);

        loader.classList.remove('hidden');
        infoSection.classList.add('hidden');
    }

    // Hide URL loading state
    hideURLLoading() {
        const loader = document.getElementById('quiz-loader');
        const urlInfo = document.getElementById('url-info');
        if (loader) loader.classList.add('hidden');
        if (urlInfo) urlInfo.remove();
    }

    // Show error message
    showURLError(message, url) {
        this.hideURLLoading();
        
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const infoSection = document.getElementById('file-format-info');
        
        if (errorDiv && errorText) {
            errorText.textContent = '';
            const add = (tag, text) => {
                const el = document.createElement(tag);
                el.textContent = text;
                errorText.appendChild(el);
                return el;
            };
            add('strong', 'Failed to load quiz from URL:');
            errorText.appendChild(document.createElement('br'));
            add('code', url);
            errorText.appendChild(document.createElement('br'));
            add('strong', 'Error: ').after(document.createTextNode(message));
            const list = document.createElement('ul');
            [
                'The URL is accessible and returns a valid quiz file',
                'The file is hosted on the same server as this page',
                'The file format is supported (JSON, XML, or TXT)'
            ].forEach(text => {
                const li = document.createElement('li');
                li.textContent = text;
                list.appendChild(li);
            });
            errorText.appendChild(list);

            errorDiv.classList.remove('hidden');
            infoSection.classList.add('hidden');
        }
    }

    // Generate shareable URL
    static generateShareableURL(quizUrl, title = null, language = null, showPrizeDraw = true) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('quiz', quizUrl);
        if (title) {
            params.set('title', title);
        }
        if (language && language !== 'en') {
            params.set('lang', language);
        }
        if (!showPrizeDraw) {
            params.set('prizeDraw', 'false');
        }
        
        return `${baseUrl}?${params.toString()}`;
    }
}

// Global variables
let quizApp;
let urlQuizLoader;

// Initialize the quiz application when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    
    quizApp = new QuizApp();
    
    urlQuizLoader = new URLQuizLoader(quizApp);
    
    // Make them globally accessible for debugging
    window.quizApp = quizApp;
    window.urlQuizLoader = urlQuizLoader;
    
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
