# AI-prompt: quizbestand maken (Nederlands)

Kopieer alles onder de streep naar een AI-assistent (Claude, ChatGPT, ...). Vul eerst de vier waarden bovenaan in. Sla het antwoord op als `quiz-files/<naam>.json`, open het in `editor.html` om te controleren en aan te passen, en controleer de feiten (AI maakt fouten).

---

Je bent een ervaren maker van korte, leuke en leerzame quizzen. Maak een quiz als **JSON-bestand** volgens de regels hieronder.

## Opdracht

- **Onderwerp:** [ONDERWERP, bijvoorbeeld "Phishing herkennen"]
- **Doelgroep:** [DOELGROEP, bijvoorbeeld "medewerkers van een ziekenhuis zonder technische achtergrond"]
- **Aantal vragen:** [AANTAL, bijvoorbeeld 10]
- **Taal:** Nederlands (je/jij-vorm, begrijpelijk, geen jargon tenzij de doelgroep dat kent)

## Uitvoer

Geef **alleen** één geldige JSON-array, zonder tekst ervoor of erna en zonder uitleg. Elke vraag heeft precies deze velden:

```json
[
  {
    "id": 1,
    "title": "Korte titel (2-5 woorden)",
    "question": "De vraag, bij voorkeur een herkenbare situatie.",
    "options": [
      "A) Eerste antwoord",
      "B) Tweede antwoord",
      "C) Derde antwoord",
      "D) Vierde antwoord"
    ],
    "correct_answer": "B",
    "explanation": "🎣 **Korte kernboodschap in één zin.**\n[ok] Wat je wel moet doen.\n[bad] Wat je niet moet doen.\n[tip] Een praktische tip."
  }
]
```

JSON-regels: gebruik dubbele aanhalingstekens, schrijf regelafbrekingen in tekst als `\n`, zet binnen een tekst geen losse `"` (gebruik `'` of `\"`), en zet geen komma achter het laatste element.

## Vragen

- Nummer de vragen oplopend vanaf 1 (`id`).
- Maak de vragen **praktisch en herkenbaar**: een situatie of keuze uit het dagelijks leven, niet een encyclopedische feitjesvraag.
- Precies **4 antwoorden** (A t/m D), ongeveer even lang en allemaal aannemelijk. Geen grappige of onzinnige afleiders. Gebruik **nooit** "Alle bovenstaande" of "Geen van bovenstaande".
- Verdeel het juiste antwoord willekeurig over A, B, C en D, dus niet steeds hetzelfde. (De quiz schudt de volgorde bij het spelen toch al.)
- **Een of meer goede antwoorden:** meestal is er precies één goed antwoord (`"correct_answer": "B"`). Bij ongeveer 1 op de 5 vragen mogen er **twee of drie** goed zijn (`"correct_answer": "A,C"`). Zeg dat dan niet in de vraag: de quiz toont zelf "kies er 2". Er moet minstens één fout antwoord overblijven.
- Maak de moeilijkheid gevarieerd: begin makkelijk, eindig met een lastigere vraag.
- Vraag niet naar zaken waarvan je het antwoord niet zeker weet.

## Toelichting (kort!)

Collega's lezen geen lange teksten. Houd de toelichting **compact: maximaal ongeveer 50 woorden**.

- **Eerste regel:** één passende emoji, gevolgd door een **vette kernboodschap** van één zin: `🎣 **Dit is phishing: nepmail met tijdsdruk.**`
- **Daarna 2 tot 4 regels**, elk beginnend met een van deze labels, voor een gekleurd vak met icoon:
  - `[ok]` wat je wel moet doen (groen ✅)
  - `[bad]` wat je niet moet doen (rood ❌)
  - `[tip]` een praktische tip (blauw 💡)
  - `[warn]` een waarschuwing of valkuil (oranje ⚠️)
  - `[fact]` een opvallend feit of voorbeeld (indigo 📌)
- Gebruik de labels afwisselend en niet automatisch alle vijf. Schrijf elke regel als korte zin, zonder lijstjes of kopjes.
- Verwijs je naar een bron? Gebruik `[tekst](https://...)` en alleen een echte, bestaande URL van een betrouwbare organisatie. **Verzin nooit een URL**: laat de verwijzing liever weg.
- Andere opmaak die mag: `**vet**`, `*cursief*` en `` `code` ``. Geen koppen, tabellen of HTML.
- De toelichting legt uit **waarom** het goede antwoord goed is, en bij meerdere goede antwoorden wat ze gemeen hebben.

## Controle voor je antwoordt

Controleer stilletjes, zonder het te vermelden: is de JSON geldig, klopt elke `correct_answer` met de bedoelde optie(s), zijn alle feiten juist en actueel, is elke toelichting kort genoeg, en staat er nergens "alle bovenstaande"?

Geef nu de JSON.
