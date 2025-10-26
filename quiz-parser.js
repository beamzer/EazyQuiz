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
                let questionLines = [];
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    if (line.startsWith('TITLE:') || line.startsWith('TITEL:')) {
                        const prefix = line.startsWith('TITLE:') ? 'TITLE:' : 'TITEL:';
                        question.title = line.substring(prefix.length).trim();
                        currentSection = '';
                    } else if (line.startsWith('QUESTION:') || line.startsWith('VRAAG:')) {
                        const prefix = line.startsWith('QUESTION:') ? 'QUESTION:' : 'VRAAG:';
                        const questionText = line.substring(prefix.length).trim();
                        if (questionText) {
                            questionLines.push(questionText);
                        }
                        currentSection = 'question';
                    } else if (line.startsWith('CORRECT:') || line.startsWith('ANTWOORD:')) {
                        const prefix = line.startsWith('CORRECT:') ? 'CORRECT:' : 'ANTWOORD:';
                        question.correct_answer = line.substring(prefix.length).trim();
                        currentSection = '';
                    } else if (line.startsWith('EXPLANATION:') || line.startsWith('TOELICHTING:')) {
                        const prefix = line.startsWith('EXPLANATION:') ? 'EXPLANATION:' : 'TOELICHTING:';
                        const explanationText = line.substring(prefix.length).trim();
                        if (explanationText) {
                            explanationLines.push(explanationText);
                        }
                        currentSection = 'explanation';
                    } else if (line.match(/^[A-Z]\)/)) {
                        // This is an option
                        question.options.push(line);
                        currentSection = '';
                    } else {
                        // This is a continuation line
                        if (currentSection === 'explanation') {
                            explanationLines.push(line);
                        } else if (currentSection === 'question') {
                            questionLines.push(line);
                        }
                        // If no current section and line doesn't start with a keyword,
                        // it might be part of explanation (common case)
                        else if (!line.startsWith('TITLE:') && !line.startsWith('TITEL:') &&
                                 !line.startsWith('QUESTION:') && !line.startsWith('VRAAG:') &&
                                 !line.startsWith('CORRECT:') && !line.startsWith('ANTWOORD:') &&
                                 !line.startsWith('EXPLANATION:') && !line.startsWith('TOELICHTING:') &&
                                 !line.match(/^[A-Z]\)/) && 
                                 explanationLines.length > 0) {
                            explanationLines.push(line);
                            currentSection = 'explanation';
                        }
                    }
                }
                
                // Join multi-line content
                if (questionLines.length > 0) {
                    question.question = questionLines.join('\n');
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


    static async parseXMLContent(xmlContent) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            
            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid XML format');
            }
            
            const questions = xmlDoc.querySelectorAll('question');
            const quizData = [];
            
            questions.forEach((q, index) => {
                const id = q.getAttribute('id') || (index + 1);
                const title = q.querySelector('title')?.textContent?.trim() || `Question ${id}`;
                const text = q.querySelector('text')?.textContent?.trim() || '';
                const correct = q.querySelector('correct')?.textContent?.trim() || '';
                const explanation = q.querySelector('explanation')?.textContent?.trim() || '';
                
                const options = [];
                const optionElements = q.querySelectorAll('option');
                optionElements.forEach(opt => {
                    const key = opt.getAttribute('key') || '';
                    const value = opt.textContent?.trim() || '';
                    if (key && value) {
                        options.push(`${key}) ${value}`);
                    }
                });
                
                if (text && options.length > 0 && correct) {
                    quizData.push({
                        id: parseInt(id),
                        title: title,
                        question: text,
                        options: options,
                        correct_answer: correct.toUpperCase(),
                        explanation: explanation
                    });
                }
            });
            
            if (quizData.length === 0) {
                throw new Error('No valid questions found in XML file');
            }
            
            return quizData;
        } catch (error) {
            throw new Error(`XML parsing error: ${error.message}`);
        }
    }

    static async parseTXTContent(txtContent) {
        try {
            const sections = txtContent.split('---').map(s => s.trim()).filter(s => s);
            const quizData = [];
            
            sections.forEach((section, index) => {
                const lines = section.split('\n').map(l => l.trim()).filter(l => l);
                let title = `Question ${index + 1}`;
                let question = '';
                let correct = '';
                let explanation = '';
                const options = [];
                
                let currentSection = '';
                let explanationLines = [];
                let questionLines = [];
                
                lines.forEach(line => {
                    if (line.startsWith('TITLE:') || line.startsWith('TITEL:')) {
                        const prefix = line.startsWith('TITLE:') ? 'TITLE:' : 'TITEL:';
                        title = line.substring(prefix.length).trim();
                        currentSection = '';
                    } else if (line.startsWith('QUESTION:') || line.startsWith('VRAAG:')) {
                        const prefix = line.startsWith('QUESTION:') ? 'QUESTION:' : 'VRAAG:';
                        const questionText = line.substring(prefix.length).trim();
                        if (questionText) {
                            questionLines.push(questionText);
                        }
                        currentSection = 'question';
                    } else if (line.startsWith('CORRECT:') || line.startsWith('ANTWOORD:')) {
                        const prefix = line.startsWith('CORRECT:') ? 'CORRECT:' : 'ANTWOORD:';
                        correct = line.substring(prefix.length).trim().toUpperCase();
                        currentSection = '';
                    } else if (line.startsWith('EXPLANATION:') || line.startsWith('TOELICHTING:')) {
                        const prefix = line.startsWith('EXPLANATION:') ? 'EXPLANATION:' : 'TOELICHTING:';
                        const explanationText = line.substring(prefix.length).trim();
                        if (explanationText) {
                            explanationLines.push(explanationText);
                        }
                        currentSection = 'explanation';
                    } else if (/^[A-Z]\)/.test(line)) {
                        options.push(line);
                        currentSection = '';
                    } else {
                        // Handle continuation lines
                        if (currentSection === 'explanation') {
                            explanationLines.push(line);
                        } else if (currentSection === 'question') {
                            questionLines.push(line);
                        }
                        // If no current section, assume it's part of explanation if we have explanation content
                        else if (!line.startsWith('TITLE:') && !line.startsWith('TITEL:') &&
                                 !line.startsWith('QUESTION:') && !line.startsWith('VRAAG:') &&
                                 !line.startsWith('CORRECT:') && !line.startsWith('ANTWOORD:') &&
                                 !line.startsWith('EXPLANATION:') && !line.startsWith('TOELICHTING:') &&
                                 !/^[A-Z]\)/.test(line) && 
                                 explanationLines.length > 0) {
                            explanationLines.push(line);
                            currentSection = 'explanation';
                        }
                    }
                });
                
                // Join multi-line content
                if (questionLines.length > 0) {
                    question = questionLines.join('\n');
                }
                
                explanation = explanationLines.join('\n');
                
                if (question && options.length > 0 && correct) {
                    quizData.push({
                        id: index + 1,
                        title: title,
                        question: question,
                        options: options,
                        correct_answer: correct,
                        explanation: explanation
                    });
                }
            });
            
            if (quizData.length === 0) {
                throw new Error('No valid questions found in TXT file');
            }
            
            return quizData;
        } catch (error) {
            throw new Error(`TXT parsing error: ${error.message}`);
        }
    }

}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizParser;
} else {
    window.QuizParser = QuizParser;
}
