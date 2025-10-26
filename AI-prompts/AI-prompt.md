# Quiz File Generation Prompt

Create a comprehensive quiz file about **[TOPIC]** following this exact format and structure:

## Required Format Structure:
```
TITLE: [Quiz Title]

QUESTION: [Question text]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Extensive explanation with markdown formatting]
**=>** [Additional point on new line]
**=>** [Another point on new line]
**=>** [Optional third point on new line]

---
```

## Specific Requirements:

### TITLE:
- Create a clear, descriptive title related to **[TOPIC]**
- Keep it concise but informative
- No special formatting needed

### QUESTION:
- Write a clear, unambiguous question about **[TOPIC]**
- Ensure the question tests important knowledge or concepts
- Make it specific and measurable when possible
- Avoid trick questions or overly complex wording

### ANSWER OPTIONS (A-D):
- Provide exactly 4 options (A, B, C, D)
- Make all options plausible to someone with limited knowledge
- Ensure only one option is clearly correct
- Use consistent formatting and similar length when possible
- Include specific numbers, percentages, or concrete details when relevant

### CORRECT:
- Specify only the letter (A, B, C, or D) of the correct answer
- Double-check this matches your intended correct option

### EXPLANATION:
- **MUST be extensive and educational** - aim for 3-5 sentences minimum
- Start with a clear statement confirming the correct answer
- Include relevant statistics, facts, or research findings
- Use markdown formatting including:
  - **Bold text** for emphasis on key points
  - [Link text](URL) for external references when available
  - **=>** bullet points for additional important information (EACH ON A NEW LINE)
- Add 2-3 bullet points using **=>** format with supplementary information
- **IMPORTANT**: Each **=>** bullet point must start on a new line
- Include at least one markdown URL to a credible source for further reading
- Make the explanation valuable for learning, not just answer justification

### SEPARATOR:
- End with exactly three dashes: `---`

## Content Guidelines:
- Focus specifically on **[TOPIC]**
- Ensure factual accuracy
- Use current, evidence-based information
- Include credible sources and references
- Make questions educational and practically relevant
- Vary difficulty levels appropriately
- Include real-world applications when possible

## Example Reference Structure:
```
EXPLANATION: [Opening statement with correct answer and source link]
**=>** [Additional relevant fact or statistic]
**=>** [Practical implication or importance]
**=>** [Optional third supporting point]
```

Generate **[NUMBER]** questions following this exact format about **[TOPIC]**.

---

**Instructions for use:** Replace [TOPIC] with your desired subject matter and [NUMBER] with how many questions you want. The AI will generate properly formatted quiz questions with extensive explanations, markdown formatting, and credible source links.
