// Client-side editor for quiz JSON files. Nothing is sent to the server.
(function () {
    const $ = id => document.getElementById(id);
    const LETTERS = 'ABCDEF';
    let quiz = [];       // [{title, question, options: [{text}], correct: index, explanation}]
    let current = 0;
    let fileName = 'quiz.json';

    const blank = () => ({ title: '', question: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correct: 0, explanation: '' });

    function status(msg, cls) {
        const el = $('status');
        el.textContent = msg;
        el.className = cls || '';
    }

    // Normalized parser output -> editor model
    function fromParsed(parsed) {
        return parsed.map(q => ({
            title: q.title || '',
            question: q.question,
            options: q.options.map(o => ({ text: o.text })),
            correct: Math.max(0, q.options.findIndex(o => o.key === q.correct_answer)),
            explanation: q.explanation || ''
        }));
    }

    function toJSON() {
        return quiz.map((q, i) => ({
            id: i + 1,
            title: q.title,
            question: q.question,
            options: q.options.map((o, j) => `${LETTERS[j]}) ${o.text}`),
            correct_answer: LETTERS[q.correct],
            explanation: q.explanation
        }));
    }

    function saveFormToModel() {
        const q = quiz[current];
        if (!q) return;
        q.title = $('f-title').value;
        q.question = $('f-question').value;
        q.explanation = $('f-explanation').value;
        q.options = Array.from(document.querySelectorAll('#options .option-row input[type=text]')).map(i => ({ text: i.value }));
        const checked = document.querySelector('#options input[type=radio]:checked');
        q.correct = checked ? Number(checked.value) : 0;
    }

    function renderList() {
        const list = $('question-list');
        list.textContent = '';
        quiz.forEach((q, i) => {
            const li = document.createElement('li');
            li.textContent = `${i + 1}. ${q.title || q.question.slice(0, 40) || '(leeg)'}`;
            if (i === current) li.className = 'active';
            li.addEventListener('click', () => select(i));
            list.appendChild(li);
        });
    }

    function renderForm() {
        const q = quiz[current];
        $('question-form').classList.toggle('hidden', !q);
        if (!q) return;
        $('f-title').value = q.title;
        $('f-question').value = q.question;
        $('f-explanation').value = q.explanation;
        renderOptions();
    }

    function renderOptions() {
        const q = quiz[current];
        const box = $('options');
        box.textContent = '';
        q.options.forEach((o, j) => {
            const row = document.createElement('div');
            row.className = 'option-row';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'correct';
            radio.value = j;
            radio.checked = j === q.correct;
            radio.title = 'Juiste antwoord';
            const letter = document.createElement('span');
            letter.className = 'letter';
            letter.textContent = LETTERS[j];
            const text = document.createElement('input');
            text.type = 'text';
            text.value = o.text;
            const del = document.createElement('button');
            del.type = 'button';
            del.textContent = '✕';
            del.title = 'Verwijder antwoord';
            del.addEventListener('click', () => {
                if (q.options.length <= 2) return status('Minimaal 2 antwoorden', 'error');
                saveFormToModel();
                q.options.splice(j, 1);
                if (q.correct >= q.options.length) q.correct = 0;
                else if (q.correct > j) q.correct--;
                renderOptions();
            });
            row.append(radio, letter, text, del);
            box.appendChild(row);
        });
        $('add-option').classList.toggle('hidden', q.options.length >= LETTERS.length);
    }

    function select(i) {
        saveFormToModel();
        current = i;
        renderList();
        renderForm();
    }

    function setQuiz(data, name) {
        quiz = data;
        current = 0;
        if (name) fileName = name;
        renderList();
        renderForm();
        persist();
    }

    function persist() {
        try { localStorage.setItem('eazyquiz-editor-draft', JSON.stringify({ quiz, fileName })); } catch (_) { /* optional */ }
    }

    function validate() {
        saveFormToModel();
        try {
            QuizParser.validateQuizData(toJSON());
            return true;
        } catch (e) {
            status(e.message, 'error');
            return false;
        }
    }

    $('file-input').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const parsed = QuizParser.parseJSON(await QuizParser.readFile(file));
            setQuiz(fromParsed(parsed), file.name);
            status(`${parsed.length} vragen geladen`, 'ok');
        } catch (err) {
            status(err.message, 'error');
        }
        e.target.value = '';
    });

    $('new-btn').addEventListener('click', () => {
        if (quiz.length && !confirm('Huidige wijzigingen weggooien en een nieuwe quiz starten?')) return;
        setQuiz([blank()], 'nieuwe-quiz.json');
        status('');
    });

    $('add-btn').addEventListener('click', () => {
        saveFormToModel();
        quiz.splice(current + 1, 0, blank());
        select(current + 1 > quiz.length - 1 ? quiz.length - 1 : current + 1);
        $('f-title').focus();
    });

    $('dup-btn').addEventListener('click', () => {
        saveFormToModel();
        quiz.splice(current + 1, 0, JSON.parse(JSON.stringify(quiz[current])));
        select(current + 1);
    });

    $('del-btn').addEventListener('click', () => {
        if (!quiz.length || !confirm('Deze vraag verwijderen?')) return;
        quiz.splice(current, 1);
        current = Math.min(current, quiz.length - 1);
        renderList();
        renderForm();
        persist();
    });

    function move(delta) {
        saveFormToModel();
        const j = current + delta;
        if (j < 0 || j >= quiz.length) return;
        [quiz[current], quiz[j]] = [quiz[j], quiz[current]];
        current = j;
        renderList();
        persist();
    }
    $('up-btn').addEventListener('click', () => move(-1));
    $('down-btn').addEventListener('click', () => move(1));

    $('add-option').addEventListener('click', () => {
        saveFormToModel();
        quiz[current].options.push({ text: '' });
        renderOptions();
    });

    document.querySelectorAll('.callout-buttons button').forEach(btn => {
        btn.addEventListener('click', () => {
            const ta = $('f-explanation');
            const tag = `[${btn.dataset.tag}] `;
            const start = ta.selectionStart;
            const before = ta.value.slice(0, start);
            const prefix = before && !before.endsWith('\n') ? '\n' : '';
            ta.value = before + prefix + tag + ta.value.slice(ta.selectionEnd);
            ta.focus();
            ta.selectionStart = ta.selectionEnd = before.length + prefix.length + tag.length;
        });
    });

    $('question-form').addEventListener('input', () => { saveFormToModel(); persist(); });
    $('f-title').addEventListener('input', renderList);

    $('download-btn').addEventListener('click', () => {
        if (!validate()) return;
        const blob = new Blob([JSON.stringify(toJSON(), null, 2) + '\n'], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
        status(`${fileName} gedownload`, 'ok');
    });

    // Restore a previous draft, if any
    try {
        const draft = JSON.parse(localStorage.getItem('eazyquiz-editor-draft'));
        if (draft && Array.isArray(draft.quiz) && draft.quiz.length) {
            quiz = draft.quiz;
            fileName = draft.fileName || fileName;
            status('Eerder concept hersteld', 'ok');
        }
    } catch (_) { /* no draft */ }
    renderList();
    renderForm();
})();
