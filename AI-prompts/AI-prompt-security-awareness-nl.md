# Security Awareness Quiz Generator (Nederlands)

Je bent een expert in cybersecurity awareness training voor niet-technische medewerkers. Creëer een uitgebreide beveiligingsbewustzijn quiz in JSON-formaat die voldoet aan de exacte structuur en kwaliteitseisen hieronder.

## Vereiste JSON Structuur

Creëer een JSON array met precies 10 quiz vragen. Elke vraag moet deze exacte structuur volgen:

```json
[
  {
    "id": 1,
    "title": "Korte Onderwerp Titel",
    "question": "De hoofdvraag in begrijpelijke Nederlandse taal",
    "options": [
      "A) Eerste optie",
      "B) Tweede optie", 
      "C) Derde optie",
      "D) Vierde optie"
    ],
    "correct_answer": "A",
    "explanation": "Uitgebreide uitleg met praktische beveiligingstips..."
  }
]
```

## Inhoudsvereisten

### Doelgroep: Niet-technische Medewerkers
- **Toegankelijke taal**: Vermijd technisch jargon en gebruik alledaagse termen
- **Praktische scenario's**: Focus op situaties die medewerkers dagelijks tegenkomen
- **Herkenbare voorbeelden**: Gebruik bekende bedrijfsomgevingen en tools
- **Actiegericht**: Geef concrete stappen die medewerkers kunnen nemen

### Vraag Kwaliteitseisen
- **Realistische scenario's**: Gebaseerd op echte beveiligingsincidenten
- **Dagelijkse relevantie**: Situaties die werknemers daadwerkelijk meemaken
- **Duidelijke keuzes**: Opties die logisch en onderscheidend zijn
- **Praktische kennis**: Test wat medewerkers moeten weten en doen

### Uitleg Vereisten
- **Begrijpelijk**: 200-400 woorden per uitleg in eenvoudige Nederlandse taal
- **Educatieve waarde**: Leer meer dan alleen het juiste antwoord
- **Gestructureerd**: Gebruik markdown formatting voor duidelijkheid:
  - **Vetgedrukte koppen** voor belangrijke concepten
  - Genummerde/bullet lijsten voor procedures
  - Duidelijke secties met witregels
- **Praktische tips**: Concrete acties die medewerkers kunnen ondernemen

### Taal en Opmaak
- **Nederlandse taal**: Schrijf volledig in het Nederlands
- **Toegankelijke toon**: Professioneel maar begrijpelijk voor iedereen
- **Markdown ondersteuning**: Gebruik **vet**, *cursief*, lijsten en regelafbrekingen
- **Consistente terminologie**: Gebruik herkenbare bedrijfstermen

## Voorbeeld Kwaliteitseisen (Security Awareness Focus)

### Vraag Structuur Voorbeeld:
```json
{
  "id": 1,
  "title": "Verdachte E-mail Herkennen",
  "question": "Je ontvangt een e-mail van je 'bank' waarin wordt gevraagd om je inloggegevens te controleren via een link. Wat doe je?",
  "options": [
    "A) Ik klik op de link en voer mijn gegevens in",
    "B) Ik bel eerst mijn bank om te controleren of de e-mail echt is", 
    "C) Ik forward de e-mail naar collega's om te vragen wat zij zouden doen",
    "D) Ik negeer de e-mail volledig"
  ],
  "correct_answer": "B",
  "explanation": "Gedetailleerde uitleg over phishing herkenning en veilige verificatie..."
}
```

### Uitleg Kwaliteit Voorbeeld:
- Begin met duidelijke uitleg waarom het antwoord juist is
- Leg uit wat de risico's zijn van verkeerde keuzes
- Geef praktische tips voor vergelijkbare situaties
- Verwijs naar bedrijfsbeleid of hulpbronnen waar relevant
- Gebruik voorbeelden die iedereen begrijpt

## Jouw Opdracht

Creëer een 10-vraag security awareness quiz over: **[ONDERWERP]**

### Specifieke Vereisten voor Security Awareness:
- Focus op dagelijkse beveiligingsrisico's op de werkplek
- Behandel veelvoorkomende aanvalsmethoden (phishing, social engineering, etc.)
- Geef praktische preventietips die iedereen kan toepassen
- Adresseer veelgemaakte fouten en misverstanden
- Verwijs naar relevante bedrijfsprocedures en hulpbronnen

### Vraag Verdeling:
- 3-4 basis beveiligingsvragen (wachtwoorden, e-mail, internet gebruik)
- 4-5 scenario-gebaseerde vragen (phishing, social engineering, fysieke beveiliging)
- 2-3 beleid en procedure vragen (incident melden, hulp zoeken)

### Onderwerpen om te Behandelen:
- **E-mail beveiliging**: Phishing herkenning, veilige bijlagen, verdachte links
- **Wachtwoord beveiliging**: Sterke wachtwoorden, wachtwoordmanagers, twee-factor authenticatie
- **Social engineering**: Telefonische oplichting, onbekende bezoekers, informatie delen
- **Fysieke beveiliging**: Scherm vergrendeling, clean desk policy, toegangskaarten
- **Internet gebruik**: Veilig browsen, downloads, sociale media op het werk
- **Incident respons**: Wat te doen bij verdachte activiteit, wie te contacteren
- **Mobiele apparaten**: Smartphone beveiliging, openbare WiFi, BYOD beleid
- **Data bescherming**: Gevoelige informatie, backup procedures, privacy

### Output Formaat:
Lever alleen de complete JSON array, correct geformatteerd en geldig. Geen aanvullende tekst of uitleg buiten de JSON structuur.

---

## Gebruiksinstructies

Om deze prompt te gebruiken:

1. Vervang `[ONDERWERP]` met je gewenste beveiligingsonderwerp (bijv. "Phishing Awareness", "Wachtwoord Beveiliging", "Social Engineering Herkenning")
2. Voeg eventuele organisatie-specifieke vereisten toe in de "Specifieke Vereisten" sectie
3. Verstuur naar je AI-assistent

Het resultaat is een professionele security awareness quiz die klaar is voor gebruik met de EazyQuiz applicatie.
