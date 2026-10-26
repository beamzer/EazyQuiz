# Eazy Quiz Application for all kinds of quiz files

A modern, responsive web-based quiz application that supports multiple file formats and topics. Create unlimited quizzes by simply loading different data files - no coding required!
Example screenshot:

<img src="https://github.com/beamzer/EazyQuiz/blob/main/screenshot.png" alt="Quiz Application Screenshot" width="400"/>

## ✨ Features

- **Multi-format support**: JSON, XML, and TXT file formats
- **Multi language support**: easy extensible language support, English and Dutch provided.
- **Responsive design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time scoring**: Instant feedback with detailed explanations
- **Professional UI**: Modern design with smooth animations
- **Error handling**: Comprehensive validation and user-friendly error messages
- **Accessibility**: Screen reader friendly with proper ARIA labels
- **No dependencies**: Pure vanilla JavaScript - no frameworks required

## 🚀 Quick Start

1. **Download** all files to a directory on your computer
2. **Open** `index.html` in your web browser
3. **Click** "Load Quiz" and select a quiz file
4. **Start** taking your quiz!

**Or...,** put the files on a webserver and run from there

## 🏢 Hosting on your own server

Quizzes are **not** loaded from GitHub (or any other external site). Everything, including the quiz files, must be hosted on the same server as `index.html`:

1. Clone or copy this repository to your webserver (for example `git clone https://github.com/beamzer/EazyQuiz.git`, and `git pull` for updates).
2. Put your quiz files in `quiz-files/` on that server.
3. Link to the quiz with a relative path: `index.html?quiz=quiz-files/your-quiz.json`.

A `?quiz=` URL that points to another server is refused. This prevents attackers from using a crafted link to show their own content in your quiz. It also means the quiz keeps working on a network without internet access.


## :star: Share quizzes directly via URL!

You can also load a quiz directly via the URL. For security the quiz file must be hosted on the **same server** as `index.html` (relative path or full URL on the same origin):

    index.html?quiz=quiz-files/dns-security.json&title=DNS%20Security%20Expert%20Quiz
    index.html?quiz=quiz-files/cybersecurity.xml
    index.html?quiz=quiz-files/tcp_ip_easy.txt

**Specify a different language via lang=xx, for instance:**

    index.html?quiz=quiz-files/dns-security.json&lang=nl

## 🖼️ Logo

The pages show an organisation logo from `assets/` (`amsterdam-umc-logo.jpg` in the header, `amsterdam-umc-tulip.png` as favicon). These files are **not** part of the repository (`assets/` is in `.gitignore`): copy them to the `assets/` directory on your server yourself. Without them the header shows only the alt text.

## 🎁 Prize draw

Add `&prize=true` to the URL to show an e-mail registration form after the quiz:

    index.html?quiz=quiz-files/security-awareness.json&lang=nl&prize=true

Entries are posted to `register.php` and stored in `data/prizedraw.sqlite` (one entry per e-mail address and quiz; a second attempt gets a "already registered" message).

Requirements and notes:

- PHP with `pdo_sqlite`; the `data/` directory must be writable by the web server user.
- Set `ALLOWED_DOMAINS` in `register.php` to restrict entries to company addresses.
- `.htaccess` files deny web access to `data/` and add security headers (Apache, `mod_headers`). With nginx, add the equivalent rules yourself.
- The score is calculated in the browser, so it cannot be fully trusted; use it to pick participants, not as proof.

## ✏️ Quiz editor

Open `editor.html` to edit quiz JSON files in a form instead of by hand: open a file, change titles, questions, answers (tick the correct one; tick several for multiple correct answers), reorder, duplicate or delete questions, and insert callouts. **Download JSON** validates the quiz and saves the file; put it in `quiz-files/` yourself. The editor works fully in the browser (nothing is uploaded) and keeps a draft in the browser's local storage. See a [screenshot of the editor](EazyQuiz-editor.png).

## 💡 Easy: let AI generate the quiz for you
You can generate a quiz about a certain topic with the use of AI. These prompts produce a quiz file in the right format, with short, colourful explanations and optional multiple-answer questions: [Dutch prompt](AI-prompts/quiz-prompt-nl.md) and [English prompt](AI-prompts/quiz-prompt-en.md). Fill in the topic, audience and number of questions, save the result in `quiz-files/`, then check and edit it in `editor.html` (disclaimer: your mileage may vary depending on the model used, and always fact-check the result).


## 📁 Project Structure

```
quiz-app/
├── index.html              # Main HTML file
├── quiz-styles.css         # Stylesheet
├── quiz-parser.js          # File format parser
├── quiz-app.js            # Main application logic
├── README.md              # This file
└── sample-files/          # Example quiz files
    ├── dns-security.json  # DNS Security quiz (JSON)
    ├── cybersecurity.xml  # Cybersecurity basics (XML)
    └── security-basics.txt # Security fundamentals (TXT)
```

## 📝 Creating Quiz Files

### JSON Format (Recommended)

The JSON format offers the most flexibility and is the easiest to create:

```json
[
  {
    "id": 1,
    "title": "Question Category",
    "question": "What is your question?",
    "options": [
      "A) First option",
      "B) Second option", 
      "C) Third option",
      "D) Fourth option"
    ],
    "correct_answer": "A",
    "explanation": "Detailed explanation with **markdown** support..."
  },
  {
    "id": 2,
    "title": "Another Question",
    "question": "Next question text?",
    "options": [
      "A) Option 1",
      "B) Option 2"
    ],
    "correct_answer": "B",
    "explanation": "Another detailed explanation..."
  }
]
```

#### Links

In questions and explanations use `[text](https://...)`, or just paste a bare `https://...` address: it becomes a clickable link that opens in a new tab. Links in the answer options are shown as plain text, because the whole option is a button.

#### Questions with several correct answers

List all correct letters in `correct_answer`, separated by commas (`"A,C"`) or as an array (`["A","C"]`; in XML and TXT use `A,C`). The quiz then shows checkboxes and a "Check answer" button. The question only scores when exactly the correct options are chosen. Questions with one letter work as before.

```json
{ "question": "Which are strong passwords?", "options": ["A) ...", "B) ...", "C) ..."], "correct_answer": "A,C", "explanation": "..." }
```

#### Coloured callouts in explanations

Start a line in an explanation with `[ok]`, `[bad]`, `[tip]`, `[warn]` or `[fact]` to show it as a coloured box with an icon (green, red, blue, orange, indigo). Keep explanations short: a bold headline plus two or three callouts reads better than a wall of text.

```
**Updates close holes hackers look for.**\n[ok] Install within 24-48 hours.\n[warn] WannaCry hit unpatched computers.
```

### XML Format

Well-structured XML format for those who prefer markup:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question id="1">
    <title>Question Category</title>
    <text>What is your question?</text>
    <options>
      <option key="A">First option</option>
      <option key="B">Second option</option>
      <option key="C">Third option</option>
      <option key="D">Fourth option</option>
    </options>
    <correct>A</correct>
    <explanation>Detailed explanation here...</explanation>
  </question>
</quiz>
```

### TXT Format (Simplest)

Plain text format with simple delimiters:

```
TITLE: Question Category
QUESTION: What is your question?
A) First option
B) Second option
C) Third option
D) Fourth option
CORRECT: A
EXPLANATION: Detailed explanation here...
---
TITLE: Next Question Category
QUESTION: Another question?
A) Option 1
B) Option 2
CORRECT: B
EXPLANATION: Another explanation...
```

## 🎯 Quiz Creation Guidelines

### Required Fields
- **Question text**: Clear, concise question
- **Options**: 2-6 answer choices (A, B, C, D, E, F)
- **Correct answer**: Letter corresponding to correct option
- **Explanation**: Detailed explanation of the answer

### Optional Fields
- **Title**: Category or topic name (auto-generated if missing)
- **ID**: Question number (auto-assigned if missing)

### Best Practices

1. **Clear questions**: Write unambiguous, specific questions
2. **Balanced options**: Make all options plausible
3. **Detailed explanations**: Provide educational value beyond just the answer
4. **Consistent formatting**: Use the same style throughout your quiz
5. **Appropriate difficulty**: Match questions to your target audience

## 🛠️ Technical Details

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### File Size Limits
- Maximum file size: 10MB
- Maximum questions: 1000 per quiz
- Maximum explanation length: 10,000 characters

### Security Features
- Client-side file processing (no data sent to servers)
- Input validation and sanitization
- XSS protection for user content
- Error boundary handling

## 🎨 Customization

### Styling
Edit `quiz-styles.css` to customize:
- Color scheme (CSS custom properties in `:root`)
- Typography and spacing
- Button styles and animations
- Responsive breakpoints

### Functionality  
Modify `quiz-app.js` to add:
- Custom scoring algorithms
- Additional question types
- Integration with learning management systems
- Progress persistence

## 🔧 Troubleshooting

### Common Issues

**Q: Quiz won't load**
- Check file format matches extension (.json, .xml, .txt)
- Validate JSON syntax using an online validator
- Ensure all required fields are present

**Q: Questions display incorrectly**
- Verify correct answer letters match option letters
- Check for special characters that need escaping
- Ensure explanations don't contain unescaped HTML

**Q: Mobile display issues**
- Clear browser cache
- Ensure viewport meta tag is present
- Test in different mobile browsers

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Unsupported file format" | Wrong file extension | Use .json, .xml, or .txt |
| "JSON parsing error" | Invalid JSON syntax | Validate JSON format |
| "Missing required fields" | Incomplete question data | Add all required fields |
| "Correct answer not found" | Answer key doesn't match options | Fix answer letter |

## 📋 Examples

The `sample-files/` directory includes:

1. **dns-security.json** - Technical DNS security quiz
2. **cybersecurity.xml** - General cybersecurity questions  
3. **security-basics.txt** - Fundamental security concepts

These demonstrate different complexity levels and formatting options.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly across browsers
5. Submit a pull request

### Areas for Contribution
- Additional Quiz files on various topics
- New question types (multiple select, drag-and-drop)

## 📄 License

This project is licensed under Attribution-NonCommercial-ShareAlike 4.0 International License - see below for details:
CC BY-NC-SA 4.0
https://creativecommons.org/licenses/by-nc-sa/4.0/
```
You are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material
The licensor cannot revoke these freedoms as long as you follow the license terms.
Under the following terms:
- Attribution — You must give appropriate credit , provide a link to the license, and indicate if changes were made . You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
- NonCommercial — You may not use the material for commercial purposes .
- ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
- No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.
Notices:
- You do not have to comply with the license for elements of the material in the public domain or where your use is permitted by an applicable exception or limitation .

No warranties are given. The license may not give you all of the permissions necessary for your intended use. For example, other rights such as publicity, privacy, or moral rights may limit how you use the material.
```

## 📞 Support

- **Documentation**: Check the built-in format examples in the application
- **Issues**: Create detailed bug reports with browser and file information
- **Feature requests**: Describe your use case and expected behavior

## The following part is completely hallucinated by AI which I won't be held responsible for ;)

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] Timed quizzes with countdown
- [ ] Question randomization
- [ ] Image and multimedia support
- [ ] Progress saving (localStorage)
- [ ] CSV export of results

### Version 2.1 (Future)
- [ ] Multiple quiz formats in one session
- [ ] User profiles and history
- [ ] Advanced analytics dashboard
- [ ] Integration APIs

---

**Made with ❤️ for educators and learners everywhere**
