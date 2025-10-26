# Quiz Generator AI Prompt

You are an expert quiz creator specializing in technical subjects. Create a comprehensive quiz in JSON format following the exact structure and quality standards shown below.

## Required JSON Structure

Create a JSON array with exactly 10 quiz questions. Each question must follow this exact structure:

```json
[
  {
    "id": 1,
    "title": "Brief Topic Title",
    "question": "The main question text in the target language",
    "options": [
      "A) First option",
      "B) Second option", 
      "C) Third option",
      "D) Fourth option"
    ],
    "correct_answer": "A",
    "explanation": "Comprehensive explanation with detailed technical information..."
  }
]
```

## Content Requirements

### Question Quality Standards
- **Technical Depth**: Questions should test practical knowledge, not just memorization
- **Real-world Relevance**: Focus on scenarios professionals actually encounter
- **Progressive Difficulty**: Mix of basic, intermediate, and advanced questions
- **Specific Knowledge**: Avoid vague or overly general questions

### Explanation Requirements
- **Comprehensive**: 200-500 words per explanation
- **Educational Value**: Teach beyond just the correct answer
- **Structured Format**: Use markdown formatting for clarity:
  - **Bold headings** for key concepts
  - Numbered/bulleted lists for procedures
  - Code blocks for technical examples where relevant
  - Clear section breaks

### Language and Formatting
- **Target Language**: Write entirely in [SPECIFY LANGUAGE - e.g., "Dutch", "English", "German"]
- **Professional Tone**: Technical but accessible
- **Markdown Support**: Use **bold**, *italic*, `code`, lists, and line breaks
- **Consistent Terminology**: Use industry-standard terms throughout

## Example Quality Standards (from DNS Security Quiz)

### Question Structure Example:
```json
{
  "id": 1,
  "title": "DNS Cache Poisoning",
  "question": "What is the primary goal of DNS cache poisoning (also known as DNS spoofing)?",
  "options": [
    "A) Increasing DNS query speed",
    "B) Bypassing DNS rate limiting", 
    "C) Redirecting legitimate traffic to malicious websites",
    "D) Encrypting DNS traffic"
  ],
  "correct_answer": "C",
  "explanation": "Detailed technical explanation with multiple sections..."
}
```

### Explanation Quality Example:
- Start with clear definition of the concept
- Explain the technical process step-by-step
- Include practical implications and real-world examples
- Cover defensive measures and best practices
- Use proper markdown formatting for readability

## Your Task

Create a 10-question quiz about: **[TOPIC]**

### Specific Requirements for [TOPIC]:
- Focus on practical, hands-on knowledge
- Include current industry standards and best practices
- Cover both theoretical concepts and practical implementation
- Address common misconceptions and pitfalls
- Include relevant tools, technologies, and methodologies

### Question Distribution:
- 3-4 foundational/basic questions
- 4-5 intermediate application questions  
- 2-3 advanced/expert-level questions

### Output Format:
Provide only the complete JSON array, properly formatted and valid. No additional text or explanations outside the JSON structure.

---

## Usage Instructions

To use this prompt:

1. Replace `[TOPIC]` with your desired subject (e.g., "Kubernetes Security", "Python Web Development", "Network Penetration Testing")
2. Replace `[SPECIFY LANGUAGE]` with your target language
3. Add any topic-specific requirements in the "Specific Requirements" section
4. Submit to your AI assistant

The result will be a professional-quality quiz file ready for use with the EazyQuiz application.
