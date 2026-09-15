# Painter's Eye

> A browser-based training game for artists to improve grayscale value recognition.

**[Play](https://painters-eye.vercel.app/)** 

## Overview

**Painter's Eye** is a small interactive game designed to train an artist's ability to recognize and allow them to practice reproducing grayscale values.

Each round shows a randomly generated grayscale value for a limited amount of time. After the reference disappears, the player uses a value slider to recreate the shade from memory.

The goal is simple:

> **Memorize the value. Recreate it. Improve your eye for Value.**

The game combines visual memory, value perception, timing, and repetition into a short practice session.

## How It Works

Each session consists of **5 rounds**.

1. A countdown prepares the player.
2. A randomly generated grayscale value is displayed.
3. The player memorizes the value before the timer expires.
4. The reference disappears.
5. The player recreates the value using a 0–255 grayscale slider.
6. The guess is scored based on how close it is to the original.
7. After 5 rounds, the player's total score is displayed.

## Difficulty

Painter's Eye includes three difficulty levels:

| Difficulty | Preview Time |
| ---------- | -----------: |
| Easy       |    5 seconds |
| Hard       |    2 seconds |
| Brutal     |     1 second |

Shorter preview times force the player to rely more heavily on visual memory.

## Scoring

Each round is scored out of **10 points** based on the absolute difference between the target and guessed grayscale values.

The score uses a nonlinear penalty, meaning larger mistakes are punished more heavily than small ones.

A complete session is scored out of **50 points**.

Your personal best is saved locally in the browser using `localStorage`.

## Features

* Visual value-memory training
* Three difficulty levels
* Per-round scoring
* Interactive audio feedback
* Replay and reset functionality
* Black/white background toggle
* Browser-based, no installation required to play

## Tech Stack

* **React**
* **TypeScript**
* **Vite**
* **CSS**
* Browser `localStorage`
* Web Audio / HTML Audio API

## Getting Started

### Prerequisites

* Node.js
* npm

### Installation

```bash
git clone https://github.com/aaronzha9779/paintersEye.git
cd paintersEye
npm install
```

### Run Locally

```bash
npm run dev
```

Vite will provide a local development URL in the terminal.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```text
src/
├── App.tsx
├── App.css
├── main.tsx
└── ...
```

Static assets such as audio files are stored in the `public/` directory.

## Engineering Notes

### Value Generation

Grayscale targets are represented as values from **0–255**, allowing the game to work directly with RGB grayscale colors.

```text
0   → Black
128 → Middle Gray
255 → White
```

### Difficulty System

The preview timer dynamically changes based on the selected difficulty, allowing the same core game mechanic to scale from casual practice to a demanding visual-memory challenge.

### Scoring Algorithm

The game calculates the absolute difference between the target and guessed values and converts that difference into a score using a nonlinear scoring curve.

This makes accuracy increasingly important as the guess moves farther away from the target.

### Persistent High Score

The best session score is stored in browser `localStorage`, allowing players to close and reopen the application without losing their personal record.

### State-Driven Game Flow

The application is structured around explicit game phases:

```text
Idle
 ↓
Countdown
 ↓
Preview
 ↓
Guess
 ↓
Result
 ↓
Final Score
```

This keeps the game's UI and logic synchronized with the current round.

## Purpose

As an artist, I wanted a way to deliberately practice one of the most important, arguably the most important fundamental of drawing and painting: **value**.
Taking inspiration from dialed.gg, a game with a similar premise but with colors, I created this, as I wanted to turn an art exercise into an interactive software experience.


## Potential Future Updates

* More advanced color/value modes
* Custom training sessions
* Historical score tracking
* Accuracy analytics
* Global/local leaderboards
* Additional visual exercises
* Mobile optimizations

---

Built by **Aaron Zhang**.
