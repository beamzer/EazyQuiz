// quiz-parser.js

class QuizParser {
    static async parseFile(file) {
        const content = await this.readFile(file);
        const extension = file.name.split('.').pop().toLowerCase();
        
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
    
    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    static parseJSON(content) {
        try {
            const data = JSON.parse(content);
            return this.validateQuizData(data);
        } catch (error) {
            throw new Error(`JSON parsing error: ${error.message}`);
        }
    }
    
    static parseXML(content) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            
            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid XML format');
            }
            
            const questions = [];
            const questionNodes = xmlDoc.querySelectorAll('question');
            
            questionNodes.forEach((questionNode, index) => {
                const question = {
                    id: parseInt(questionNode.getAttribute('id')) || index + 1,
                    title: this.getTextContent(questionNode, 'title') || `Question ${index + 1}`,
                    question: this.getTextContent(questionNode, 'text'),
                    options: [],
                    correct_answer: this.getTextContent(questionNode, 'correct'),
                    explanation: this.getTextContent(questionNode, 'explanation') || 'No explanation provided.'
                };
                
                const optionNodes = questionNode.querySelectorAll('option');
                optionNodes.forEach(optionNode => {
                    const key = optionNode.getAttribute('key');
                    const text = optionNode.textContent.trim();
                    question.options.push(`${key}) ${text}`);
                });
                
                questions.push(question);
            });
            
            return this.validateQuizData(questions);
        } catch (error) {
            throw new Error(`XML parsing error: ${error.message}`);
        }
    }
    
    static parseTXT(content) {
        try {
            const questions = [];
            const questionBlocks = content.split('---').map(block => block.trim()).filter(block => block);
            
            questionBlocks.forEach((block, index) => {
                const lines = block.split('\n').map(line => line.trim()).filter(line => line);
                const question = {
                    id: index + 1,
                    title: '',
                    question: '',
                    options: [],
                    correct_answer: '',
                    explanation: ''
                };
                
                let currentSection = '';
                let explanationLines = [];
                
                for (const line of lines) {
                    if (line.startsWith('TITLE:')) {
                        question.title = line.substring(6).trim();
                    } else if (line.startsWith('QUESTION:')) {
                        question.question = line.substring(9).trim();
                    } else if (line.startsWith('CORRECT:')) {
                        question.correct_answer = line.substring(8).trim();
                    } else if (line.startsWith('EXPLANATION:')) {
                        currentSection = 'explanation';
                        explanationLines.push(line.substring(12).trim());
                    } else if (line.match(/^[A-Z]\)/)) {
                        question.options.push(line);
                    } else if (currentSection === 'explanation') {
                        explanationLines.push(line);
                    }
                }
                
                question.explanation = explanationLines.join('\n') || 'No explanation provided.';
                question.title = question.title || `Question ${index + 1}`;
                
                questions.push(question);
            });
            
            return this.validateQuizData(questions);
        } catch (error) {
            throw new Error(`TXT parsing error: ${error.message}`);
        }
    }
    
    static getTextContent(parent, selector) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : '';
    }
    
    static validateQuizData(questions) {
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Quiz must contain at least one question');
        }
        
        questions.forEach((q, index) => {
            const questionNum = index + 1;
            
            if (!q.question || typeof q.question !== 'string') {
                throw new Error(`Question ${questionNum}: Missing or invalid question text`);
            }
            
            if (!Array.isArray(q.options) || q.options.length < 2) {
                throw new Error(`Question ${questionNum}: Must have at least 2 options`);
            }
            
            if (!q.correct_answer || typeof q.correct_answer !== 'string') {
                throw new Error(`Question ${questionNum}: Missing or invalid correct answer`);
            }
            
            // Validate that correct answer exists in options
            const correctExists = q.options.some(option => 
                option.toLowerCase().startsWith(q.correct_answer.toLowerCase() + ')')
            );
            
            if (!correctExists) {
                throw new Error(`Question ${questionNum}: Correct answer "${q.correct_answer}" not found in options`);
            }
            
            // Ensure required fields exist
            q.id = q.id || questionNum;
            q.title = q.title || `Question ${questionNum}`;
            q.explanation = q.explanation || 'No explanation provided.';
        });
        
        return questions;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizParser;
} else {
    window.QuizParser = QuizParser;
}
