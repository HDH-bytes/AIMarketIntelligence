# AI Market Intelligence Dashboard

This project is a React-based dashboard that turns plain English market research questions into structured competitive insights.

A user can type in something like:

- Compare Sony vs Samsung headphones under $200
- Find pricing gaps in the yoga mat market
- Analyze review trends for air fryers this month

The app sends that query into an AI-powered analysis pipeline, gathers market signals, and returns a structured summary with competitor comparisons, pricing signals, sentiment, key findings, opportunities, risks, and a full briefing.

## Background

This project was originally done in connection with Wayfair, but I expanded it with my own direction and design choices. The base idea was market intelligence, but I added my own spin by turning it into a more polished dashboard experience with stronger structure, cleaner presentation, better fallback handling, and features that make it feel closer to a usable product.

A big part of the work was not just getting an AI response, but shaping the output into something that feels practical for research, benchmarking, and strategy.

## Why I Built It

I wanted to build something that felt closer to a real market intelligence tool than a basic chatbot interface. Instead of only returning text, this dashboard organizes the output into a format that is easier to scan, compare, and use for decision-making.

It is designed to feel clean, modern, and useful for product research, competitor analysis, and trend discovery.

## What the App Does

The dashboard allows a user to:

- ask a market or product research question in natural language
- run an AI analysis workflow
- view structured market results in a dashboard layout
- compare competitors by pricing, ratings, and market position
- read a full AI-generated market briefing
- export results as JSON for later use

## Main Features

### Natural language query input
The user can type a question directly into the text box and run the pipeline with Enter or the run button.

### Suggestion chips
The landing section includes prebuilt sample prompts so the user can quickly test the app and understand the kinds of questions it supports.

### Live loading states
The app shows two stages while processing:

- Searching
- Analyzing

This gives the interface a more realistic and polished feel.

### Structured dashboard output
Instead of only showing a paragraph response, the app breaks the result into sections like:

- signals processed
- sources searched
- average price
- sentiment
- competitors
- key findings
- opportunities
- risks
- full briefing

### Competitor benchmarking
The competitor section shows brand comparisons with pricing, ratings, positioning, and a short insight for each one.

### Market signal ticker
A moving ticker displays compact signal summaries pulled from the AI response, such as pricing snapshots or product trend indicators.

### Export to JSON
The user can export the generated report as a JSON file.

### Fallback handling
If the AI response fails to parse as valid JSON, the app still shows the returned text instead of crashing.

## How It Works

1. The user enters a market research question.
2. The app sends the query into an AI workflow.
3. A system prompt tells the model to gather relevant market data and return a strict JSON structure.
4. The app parses that response.
5. The dashboard renders the data into sections.
6. The user can read the results or export them as JSON.

## Project Structure

This version keeps everything in one file for simplicity, but the logic is separated into smaller components inside the file.

### `App`
This is the main component. It handles:

- query input
- loading state
- API calls
- result parsing
- export behavior
- conditional rendering

### `TypewriterText`
This component displays generated text with a typewriter effect and a blinking cursor.

### `Ticker`
This component creates the scrolling market signal strip.

### `Section`
This is a reusable wrapper for dashboard sections like findings, benchmarking, and briefing.

## Changes I Added

This project started from a Wayfair-related market intelligence idea, but I added my own changes to make it feel much more complete and product-like.

### 1. Turned it into a fuller dashboard experience
I pushed it beyond a simple prompt and response setup and gave it a clearer dashboard structure.

### 2. Added structured JSON output
The program now expects a predictable JSON object instead of freeform text. That makes it possible to display the results in a much more organized way.

### 3. Added loading phases
The interface now tracks whether the app is searching or analyzing, which improves the flow and gives better user feedback.

### 4. Added a scrolling ticker
The ticker gives the app more movement and makes it feel more like a live intelligence product.

### 5. Added suggestion prompts
These make the app easier to test and easier for first-time users to understand.

### 6. Added competitor benchmarking
Instead of burying everything in one text block, competitor information is broken out into its own section.

### 7. Added findings, opportunities, and risks panels
This makes the output easier to skim and more useful from a strategy point of view.

### 8. Added JSON export
The export feature makes it easier to reuse the results in reports, workflows, or future tools.

### 9. Added parsing fallback logic
If the AI response is not valid JSON, the app still shows the output instead of failing.

### 10. Improved the visual design
I styled the project to feel more premium and polished through:

- dark theme styling
- typography using Playfair Display, DM Sans, and DM Mono
- soft borders and layered sections
- subtle animations
- cleaner spacing and hierarchy

## API and Security Note

There is no API key included in the frontend code shown in this version.

That means two things:

- no secret key is exposed in the client
- the direct API request is not production-ready as written

For a real deployment, the API call should be moved to a secure backend or serverless function. The frontend should send the query to your backend, and the backend should handle the external API call using environment variables for secret credentials.

This is the right approach for security, maintainability, and deployment.

## Docker

Docker is a good fit for this project because it makes the app easier to run consistently across different machines and environments.

Using Docker, you can:

- package the frontend into a portable container
- avoid local environment mismatch issues
- make onboarding easier for teammates or reviewers
- prepare the project for cleaner deployment workflows

For a project like this, Docker is especially useful if the app later grows into a full-stack version with:

- a React frontend
- a backend or serverless API layer
- environment-based secret management
- deployment through a container platform

A simple next step would be to containerize the frontend with a `Dockerfile`, and later add `docker-compose` if you introduce a backend service.

### Example Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
