# AI prompt: create a quiz file (English)

Copy everything below the line into an AI assistant (Claude, ChatGPT, ...). Fill in the four values at the top first. Save the answer as `quiz-files/<name>.json`, open it in `editor.html` to check and adjust it, and fact-check the content (AI makes mistakes).

---

You are an experienced author of short, engaging and educational quizzes. Create a quiz as a **JSON file** following the rules below.

## Assignment

- **Topic:** [TOPIC, for example "Recognising phishing"]
- **Audience:** [AUDIENCE, for example "hospital staff without a technical background"]
- **Number of questions:** [NUMBER, for example 10]
- **Language:** English (plain, friendly, no jargon unless the audience knows it)

## Output

Return **only** one valid JSON array, with no text before or after it and no commentary. Every question has exactly these fields:

```json
[
  {
    "id": 1,
    "title": "Short title (2-5 words)",
    "question": "The question, preferably a recognisable situation.",
    "options": [
      "A) First answer",
      "B) Second answer",
      "C) Third answer",
      "D) Fourth answer"
    ],
    "correct_answer": "B",
    "explanation": "🎣 **One-sentence key message.**\n[ok] What you should do.\n[bad] What you should not do.\n[tip] A practical tip."
  }
]
```

JSON rules: use double quotes, write line breaks inside text as `\n`, never put a bare `"` inside a text (use `'` or `\"`), and no trailing comma after the last element.

## Questions

- Number questions ascending from 1 (`id`).
- Make questions **practical and recognisable**: a situation or choice from daily life, not an encyclopaedic trivia question.
- Exactly **4 answers** (A to D), roughly equal in length and all plausible. No silly or absurd distractors. **Never** use "All of the above" or "None of the above".
- Spread the correct answer randomly over A, B, C and D. (The quiz shuffles the order when played anyway.)
- **One or more correct answers:** usually exactly one answer is correct (`"correct_answer": "B"`). For about 1 in 5 questions, **two or three** may be correct (`"correct_answer": "A,C"`). Do not mention this in the question text: the quiz shows "choose 2" itself. At least one wrong answer must remain.
- Vary the difficulty: start easy, end with a harder question.
- Do not ask about things whose answer you are not sure of.

## Explanation (keep it short!)

Colleagues do not read long texts. Keep each explanation **compact: about 50 words at most**.

- **First line:** one fitting emoji followed by a **bold one-sentence key message**: `🎣 **This is phishing: a fake email with time pressure.**`
- **Then 2 to 4 lines**, each starting with one of these labels, which render as a coloured box with an icon:
  - `[ok]` what you should do (green ✅)
  - `[bad]` what you should not do (red ❌)
  - `[tip]` a practical tip (blue 💡)
  - `[warn]` a warning or pitfall (orange ⚠️)
  - `[fact]` a striking fact or example (indigo 📌)
- Vary the labels; do not use all five every time. Write each line as a short sentence, without lists or headings.
- Citing a source? Use `[text](https://...)` and only a real, existing URL from a reliable organisation. **Never invent a URL**: leave the reference out instead.
- Other allowed formatting: `**bold**`, `*italic*` and `` `code` ``. No headings, tables or HTML.
- The explanation says **why** the correct answer is right and, with several correct answers, what they have in common.

## Check before you answer

Silently check, without mentioning it: is the JSON valid, does every `correct_answer` match the intended option(s), are all facts correct and current, is every explanation short enough, and is "all of the above" nowhere to be found?

Now return the JSON.
