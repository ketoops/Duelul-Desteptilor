# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

Project is not yet scaffolded. When setting up:
- Use `npm create vite@latest . -- --template react` to initialize
- `npm install` to install dependencies
- `npm run dev` to start dev server
- `npm run build` to build for production

## Project: Joc Trivia cu Intrebari Capcana

Romanian-language trick-question trivia game. Tone: ironic, clever, slightly cheeky, never toxic.

**All UI text must be in Romanian.** Code (variables, comments) in English.

### Tech Stack
- React + Vite
- Mobile-first responsive design (web + mobile)
- Capacitor later for app stores (optional)

### Gameplay Loop
Intrebare → Player types answer (NO multiple choice!) → Instant verdict → Ironic roast (wrong) / Ironic congratulation (correct) → Score / Streak → Next question

### Game Modes
1. **Normal** - 10 questions, one life, fast answers
2. **VS (1v1)** - 2 players compete
3. More modes TBD

### Game Screen Requirements
- Descriptive image per question
- Question text
- Text input for answer (NOT multiple choice — player must think and type)
- Instant feedback: ironic roast (wrong) or ironic congratulation (correct)

### Question Structure
Each question has: question text, correct answer, explanation, ironic reply, image. Loaded from JSON.

Answer matching should be case-insensitive and diacritics-tolerant (e.g., "sânge" matches "sange"). These are trick questions — answers are short and specific, so fuzzy matching should be minimal.

### Question Source
100 trick questions with roasts are in `Inspiration/intrebari_capcana_trivia.docx`. Must be converted to JSON.

### Technical Constraints
- Simple project, easy to extend
- Mobile-first responsive UI
- Highly readable text
- Questions loaded from JSON

### Design Decisions TBD
- Exact screens and flow
- Progression, streak, score, daily challenge, endless mode
- Monetization
- Exact visual style

### Status
- [ ] Setup React + Vite project
- [ ] Convert questions from docx to JSON
- [ ] Main screen (start) with game mode selection
- [ ] Normal mode (10 questions, 1 life, text input)
- [ ] VS mode (1v1)
- [ ] Ironic feedback system (roast + congratulation)
