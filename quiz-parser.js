// quiz-parser.js
// Parses JSON, XML and TXT quiz files into one normalized structure:
// [{ id, title, question, options: [{ key, text }], correct_answer, explanation }]

class QuizParser {
    static async parseFile(file) {
        const content = await this.readFile(file);
        const extension = file.name.split('.').pop().toLowerCase();
        return this.parse(content, extension);
    }

    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Parse text content of the given format ('json' | 'xml' | 'txt')
    static parse(content, extension) {
        switch (extension) {
            case 'json':
                return this.parseJSON(content);
            case 'xml':
                return this.parseXML(content);
            case 'txt':
                return this.parseTXT(content);
            default:
                throw new Error(`Unsupported file format: ${extension}`);
        }
    }

    static parseJSON(content) {
        let data;
        try {
            data = JSON.parse(content);
        } catch (error) {
            throw new Error(`JSON parsing error: ${error.message}`);
        }
        return this.validateQuizData(data);
    }

    static parseXML(content) {
        const xmlDoc = new DOMParser().parseFromString(content, 'text/xml');
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('XML parsing error: Invalid XML format');
        }

        const questions = Array.from(xmlDoc.querySelectorAll('question')).map((node, index) => ({
            id: parseInt(node.getAttribute('id'), 10) || index + 1,
            title: this.getTextContent(node, 'title'),
            question: this.getTextContent(node, 'text'),
            options: Array.from(node.querySelectorAll('option')).map(opt => {
                const key = (opt.getAttribute('key') || '').trim();
                return `${key}) ${opt.textContent.trim()}`;
            }),
            correct_answer: this.getTextContent(node, 'correct'),
            explanation: this.getTextContent(node, 'explanation')
        }));

        return this.validateQuizData(questions);
    }

    static parseTXT(content) {
        // Blocks are separated by a line that consists only of ---
        const blocks = content
            .replace(/\r\n?/g, '\n')
            .split(/^\s*---\s*$/m)
            .map(block => block.trim())
            .filter(Boolean);

        const prefixes = {
            title: ['TITLE:', 'TITEL:'],
            question: ['QUESTION:', 'VRAAG:'],
            correct: ['CORRECT:', 'ANTWOORD:'],
            explanation: ['EXPLANATION:', 'TOELICHTING:']
        };
        const matchPrefix = (line, names) => names.find(p => line.toUpperCase().startsWith(p));

        const questions = blocks.map((block, index) => {
            const question = { id: index + 1, title: '', options: [], correct_answer: '' };
            const text = { question: [], explanation: [] };
            let section = '';

            block.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
                let p;
                if ((p = matchPrefix(line, prefixes.title))) {
                    question.title = line.substring(p.length).trim();
                    section = '';
                } else if ((p = matchPrefix(line, prefixes.question))) {
                    const rest = line.substring(p.length).trim();
                    if (rest) text.question.push(rest);
                    section = 'question';
                } else if ((p = matchPrefix(line, prefixes.correct))) {
                    question.correct_answer = line.substring(p.length).trim();
                    section = '';
                } else if ((p = matchPrefix(line, prefixes.explanation))) {
                    const rest = line.substring(p.length).trim();
                    if (rest) text.explanation.push(rest);
                    section = 'explanation';
                } else if (/^[A-Za-z]\)/.test(line)) {
                    question.options.push(line);
                    section = '';
                } else if (section) {
                    text[section].push(line);
                }
            });

            question.question = text.question.join('\n');
            question.explanation = text.explanation.join('\n');
            return question;
        });

        return this.validateQuizData(questions);
    }

    static getTextContent(parent, selector) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : '';
    }

    // Validate and normalize questions. Options become { key: 'A', text: '...' }.
    static validateQuizData(questions) {
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Quiz must contain at least one question');
        }

        return questions.map((q, index) => {
            const num = index + 1;
            if (!q || typeof q !== 'object') {
                throw new Error(`Question ${num}: Invalid question`);
            }
            if (typeof q.question !== 'string' || !q.question.trim()) {
                throw new Error(`Question ${num}: Missing or invalid question text`);
            }
            if (!Array.isArray(q.options) || q.options.length < 2) {
                throw new Error(`Question ${num}: Must have at least 2 options`);
            }
            if (typeof q.correct_answer !== 'string' || !q.correct_answer.trim()) {
                throw new Error(`Question ${num}: Missing or invalid correct answer`);
            }

            const options = q.options.map(option => {
                const m = typeof option === 'string' && option.match(/^\s*([A-Za-z])\s*[).:]\s*([\s\S]*)$/);
                if (!m) {
                    throw new Error(`Question ${num}: Option "${option}" must look like "A) text"`);
                }
                return { key: m[1].toUpperCase(), text: m[2].trim() };
            });

            const keys = options.map(o => o.key);
            if (new Set(keys).size !== keys.length) {
                throw new Error(`Question ${num}: Duplicate option letters`);
            }

            const correct = q.correct_answer.trim().toUpperCase();
            if (!keys.includes(correct)) {
                throw new Error(`Question ${num}: Correct answer "${q.correct_answer}" not found in options`);
            }

            return {
                id: q.id || num,
                title: q.title || `Question ${num}`,
                question: q.question,
                options,
                correct_answer: correct,
                explanation: q.explanation || ''
            };
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizParser;
} else {
    window.QuizParser = QuizParser;
}
