# About
Succinctly is a tool that helps you learn and remember new things using a time tested tool: Flashcards. We learn new things daily, but most of it we forget over time. The best way to counter this is to leverage a pair of classic learning techniques: active recall, paired with spaced repetition. And in the age of AI, where all answers are available with a prompt, I want to leverage a tool that can help with something so fundamental to us: learning. 

Succinctly leverages LLM immense reasoning abilities (WIP) to facilitate this learning, but instead of it being in your face,  it works in the background, offering a lending hand when needed. 

Check out succinctly at 

https://succinctly.vercel.app/  (registration required) 

## Status: Prototype → MVP

The current state of this project is a **prototype**, built to validate the foundation: auth, deck and card management, a study viewer, keyboard shortcuts, and mobile gestures. The aim is to iterate away the friction in the core experience of creating and reviewing flashcards. 

The first stage was **vibe-coded** the prototype using Claude Code with a mix of known (React, Typescript) and unknown technologies (NextJS, Supabase). Now, the vibe coding has taken a step back as I take a more deliberate, **spec driven development and agentic development workflows**. 

The core differentiator here is AI-graded free-text answers. Instead of self-grading, a user types/speaks their recall response and the AI evaluates it for conceptual correctness. Spaced repetition is enhanced using AI by framing questions made by the user differently. This removes self-grading bias and makes spaced repetition intervals more accurate.

Overtime, succinctly will learn just how accurately a user needs spaced repetiton to ensure whether they have recalled a concept well enough and tailor the app to their needs. More ideas are in the pipeline if I can get significant traction to make this learning a social and cross learning experience to see how well similar concepts. 

## Motivation

I am a seasoned software engineer exploring what is possible in the world of AI assisted coding and what is next for software engineers in the era of AI assisted coding. My aim is to bring to life ideas and show case my philosophy in building amazing, frictionless user interfaces. I am learning through trial and error, where software engineers are needed and where they can step back. 

If you are a recruiter/hiring manager, please reference: 
- [Project instructions (CLAUDE.md)](CLAUDE.md)
- [Specs](docs/specs/)
- [Ideas](docs/ideas/)
- [Iteration 2 roadmap](docs/ideas/iteration-2.md)

Issues are tracked on [GitHub Issues](https://github.com/kaliaparijat/succinctly/issues).


