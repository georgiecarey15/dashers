# DASHERS

A Balderdash-style bluffing game. The **board** goes on a laptop or TV; up to **16 players**
join from their own phones with a four-letter code.

---

## Run it on your Wi-Fi (2 minutes)

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd dashers
npm install
npm start
```

The terminal prints two addresses:

```
Board (laptop / TV):  http://localhost:3000
Phones on this Wi-Fi: http://192.168.x.x:3000
```

1. Open the first address on the screen everyone can see, and click **Open the board**.
2. A four-letter code and a QR code appear. Players scan it, or type the code at the
   second address on their phones.
3. When at least 3 people have joined, hit **Deal the first card**.

Everyone must be on the same Wi-Fi.

---

## Put it online

Same folder, no changes needed. The server reads `process.env.PORT`, so it works on any
Node host.

**Render** — push this folder to a GitHub repo, then New → Blueprint and point it at the
repo. `render.yaml` does the rest.

**Railway / Fly / Heroku** — `npm install` to build, `npm start` to run. Nothing else to set.

Once deployed, the join links and QR code use the deployed domain automatically, so players
can be anywhere.

---

## A round

| Step | What happens |
|---|---|
| **Choose** | The Dasher picks one of 7 categories. |
| **Preview** | The Dasher sees the card **and its real answer**, privately. They can draw another card, back out to a different category, or lock it in. |
| **Write** | The Dasher reads the card aloud. Everyone else writes a convincing lie on their phone. |
| **Read** | The real answer is shuffled into the pile. The Dasher taps through the answers one at a time, reading each aloud as it appears on the board and on every phone. |
| **Vote** | Everyone but the Dasher votes for the answer they believe. You can't vote for your own. |
| **Reveal** | Staged, so it plays out rather than landing all at once. "The votes are in", then the most-voted answers counted down worst to best, then the real answer, then the scores. The Dasher or the board can skip it. |

### Scoring

- Finding the real answer: **+2**
- Every vote your lie steals: **+1**
- Dasher, if nobody finds the truth: **+3**

### Categories

Words · Initials · Dates · People · Movies · Scientific Studies · Bizarre Businesses

---

## Adding your own cards

Everything lives in `deck.js` as `[prompt, real answer]` pairs. Append to any category:

```js
words:[
 ["BORBORYGMUS","The rumbling your stomach makes."],
 ["YOUR WORD","Your real definition."],          // ← add here
],
```

Restart the server to pick up changes. Cards are drawn without repeats until a category is
exhausted, then the category reshuffles.

Two things make or break a card, and `npm test` checks both:

**Make it obscure.** If a decent pub quiz team would get it, it's a weak card. The fun is
nobody at the table having the faintest idea.

**Write the real answer like a person.** This one is easy to miss. If every real answer is a
tidy, complete, encyclopaedic sentence and every bluff is scrappy and human, the truth glows
in the dark and the game stops working. So vary them — some three words, some rambling, some
fragments, some starting with "No" or "It does". The deck test measures the spread of answer
lengths and flags it if they all start to sound the same.

---

## Notes

- **The answer never leaks.** Card answers are held on the server and sent only to the
  Dasher, only during the preview step. Opening devtools on the board or another phone
  won't reveal it.
- **Reconnecting works.** If a phone locks or the browser reloads mid-game, it rejoins the
  same seat with its score intact.
- **Voting is simultaneous**, not one-at-a-time — phones make it private already, and it
  keeps the round moving. If you'd rather have the drama of one player at a time, that's a
  small change in `server.js`.
- Rooms are held in memory and swept after three hours idle. Restarting the server ends any
  game in progress.

---

## Files

```
server.js      game state machine + WebSocket handling
deck.js        all the cards
public/
  index.html   landing page — open the board, or join
  host.html    the board (laptop / TV)
  play.html    the phone client
  theme.css    the whole look
render.yaml    one-click deploy config
```
