# AI Market Intelligence Dashboard

This project is a React-based dashboard that turns plain English market research questions into structured competitive insights.

A user can type in something like:

- Compare Sony vs Samsung headphones under $200
- Find pricing gaps in the yoga mat market
- Analyze review trends for air fryers this month

The app sends that query into an AI-powered analysis pipeline, gathers market signals, and returns a structured summary with competitor comparisons, pricing signals, sentiment, key findings, opportunities, risks, and a full briefing.

## Why I Built It

I wanted to build something that felt closer to a real market intelligence tool than a basic chatbot interface. Instead of only returning text, this dashboard organizes the output into a format that is easier to scan, compare, and use for decision-making.

It is designed to feel clean, modern, and useful for product research, competitor analysis, and trend discovery.

## What the App Does

The dashboard allows a user to:

- ask a market or product research question in natural language
- run a live AI analysis workflow
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

---

## How It Works

1. The user enters a market research question.
2. The app sends the query to the Anthropic Messages API.
3. A system prompt tells the model to search for relevant market data and return a strict JSON structure.
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

---

## Changes Made to the Program

Here is a cleaner explanation of what was added or improved in this version of the app.

### 1. Turned the app into a full market analysis workflow
The app now does more than accept a prompt and show a response. It runs a more structured pipeline built around a system prompt that asks the model for specific market intelligence fields.

### 2. Added structured JSON output
The program now expects the AI to return a predictable JSON object instead of freeform text. That makes it possible to build a true dashboard interface around the output.

### 3. Added loading phases
The interface now tracks whether the app is currently searching or analyzing. This improves the user experience and makes the processing feel more deliberate.

### 4. Added a scrolling ticker
The ticker gives the dashboard more motion and makes it feel like a live intelligence product. It also gives quick visibility into pricing and market signals.

### 5. Added suggestion prompts
The prebuilt suggestions improve usability and help first-time users understand what kinds of questions they can ask.

### 6. Added competitor benchmarking
Instead of hiding all information inside one block of text, the app now separates competitor information into its own section with useful details for each brand.

### 7. Added findings, opportunities, and risks panels
This makes the output more useful and easier to skim, especially for someone who wants the strategic takeaways quickly.

### 8. Added JSON export
Users can now download the analysis result for reuse in other workflows, reports, or future tooling.

### 9. Added parsing fallback logic
If the returned response is not valid JSON, the program still displays the content instead of breaking. That makes the app much more reliable.

### 10. Improved the visual design
The dashboard was styled to feel more premium and polished through:

- dark theme styling
- typography choices using Playfair Display, DM Sans, and DM Mono
- soft borders and layered panels
- subtle animation
- cleaner spacing and hierarchy

---

## Strengths of the Project

A few things this project does well:

- clean and polished interface
- strong portfolio presentation
- useful structured output
- clear separation of interface sections
- natural user flow from query to insight
- graceful fallback behavior when parsing fails

## Current Limitations

There are still a few things that should be improved.

- The API call does not currently include authentication headers, so it will not work as-is in a real deployment.
- Sensitive API logic should not live in the frontend.
- The JSON returned by the model may still be malformed sometimes.
- The ticker width is estimated using text length, so it may not always scroll perfectly across devices or fonts.
- Inline styling works for a single-file prototype, but it is harder to maintain as the project grows.

## What I Would Improve Next

If I continued building this, I would focus on the following:

### Secure the API call
Move the API request into a backend or serverless function so the API key stays private.

### Add source visibility
Show the sources used in the report so the user can verify where the insights came from.

### Validate responses more strictly
Use schema validation before rendering the AI output.

### Add charts
The dashboard would benefit from lightweight charts for:

- competitor pricing
- rating comparisons
- sentiment trends

### Save past reports
A history panel would let users compare analyses over time.

### Improve responsiveness
A mobile-friendly layout would make the dashboard more usable across screen sizes.

---

## Example Use Cases

This project can be used for:

- product research
- competitor benchmarking
- market trend analysis
- pricing research
- review and sentiment analysis
- finding whitespace opportunities in a category

## Tech Stack

- React
- JavaScript
- Fetch API
- Anthropic Messages API
- web search tool integration
- inline CSS

## Running the Project

```bash
npm install
npm run dev
