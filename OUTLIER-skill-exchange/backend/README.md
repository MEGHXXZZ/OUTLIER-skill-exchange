# OUTLIER Backend (Team CBC064)

Node.js + Express + MongoDB (Mongoose) + JWT. Runs fully local on **http://localhost:5001**.

## Run
```bash
npm install
# make sure MongoDB is running locally (brew services start mongodb-community)
npm run seed     # optional: demo users/skills (password: password123)
npm run dev
```
`.env` defaults: PORT=5001, MONGO_URI=mongodb://127.0.0.1:27017/outlier. Frontend Axios base URL: `http://localhost:5001/api`.
Send `Authorization: Bearer <token>` on every protected route.

## API
| Method | Route | Notes |
|---|---|---|
| POST | /api/auth/register | name, email, password, location, gender, [preferredGenderFilter, facelessSessionAllowed, availability] |
| POST | /api/auth/login | email, password |
| GET/PUT | /api/users/profile | availability: `[{day:"Saturday",startTime:"10:00",endTime:"12:00"}]` |
| GET | /api/users/dashboard | learnt / ongoing / taught / teaching / wantToLearn |
| GET | /api/users/passport | Skill Growth Passport: progress + badges |
| POST | /api/users/skill | skillName, type (teach/learn), proficiency. A `learn` skill notifies matching teachers |
| DELETE | /api/users/skill/:id | |
| PUT | /api/users/skill/:id/verify | quizScore >= 80 verifies |
| GET | /api/match | filters: skill, proficiency, location, gender, faceless, verifiedOnly, teacherId, minReliability |
| POST | /api/match/rescue | cancelledSessionId |
| POST | /api/sessions/book | teacher_id, skillName, scheduledTime (future), sessionType, facelessSession |
| GET | /api/sessions/my-sessions | ongoing / completed / cancelled |
| PUT | /api/sessions/:id/accept | teacher only |
| PUT | /api/sessions/:id/reschedule | scheduledTime |
| PUT | /api/sessions/:id/cancel | cancellationReason **required**; returns `rescueMatches` |
| PUT | /api/sessions/:id/checkin | attendance |
| PUT | /api/sessions/:id/complete | +2 reliability both users |
| GET | /api/circles | optional ?skill= |
| POST | /api/circles/create | skillName, maxCapacity, description, scheduledTime |
| POST | /api/circles/:id/join, /leave | |
| GET | /api/notifications | `{unread, notifications}` |
| PUT | /api/notifications/:id/read, /read-all | |

## Push notifications (Firebase, optional)
1. Download a service account JSON from Firebase Console -> Project settings -> Service accounts.
2. Save it as `serviceAccountKey.json` in this folder (it is git-ignored; never share it in chat or commit it).
3. Restart. The log says "Firebase push notifications enabled". Without the file everything still works with in-app notifications.
4. Frontend registers a device token with `PUT /api/users/fcm-token {fcmToken}`.

## Frontend compatibility aliases
`POST /api/sessions` (= book), `POST /api/verify {skillId, quizScore}`, cancel accepts `{reason}`, reschedule accepts `{slot}` (ISO date).
Frontend `src/api.js` must use `http://localhost:5001/api` (it currently says 5000).

## Frontend integration notes
- Cancel response: `rescueMatches` (replacement teachers, same skill and time; always computed) and `alternativeSlots`
  (teacher's next open slots as ISO dates) for the Rescue Match modal.
- Skill verification passes at quizScore >= 60 (frontend quiz: 2 of 3 correct).
- `POST /api/sessions/book` accepts `isRescueMatch: true` for sessions created from a Rescue Match.

## Rules implemented
- Match score: +40 mutual skills (+20 one-way), +30 availability overlap, +20 same location, +10 reliability >= 80. Top result flagged `bestMatch`.
- No match: `noMatch: true` plus a message (frontend shows wishlist / notify-me).
- Cancel: reason required; -5 reliability, -10 if under 15 minutes notice; teacher cancel returns rescue candidates (same skill, available at that time).
- Rescue Match, check-ins, community circles, face/faceless flag, gender filter, notifications all included.

## Demo flow (after `npm run seed`)
1. Login meghavathi@test.com, GET /api/match -> Kayashree 100%, Arjun next.
2. Book Saturday session with Kayashree, she accepts.
3. Kayashree cancels with a reason -> response lists Arjun as a rescue match.
4. Complete a session, then GET /api/users/passport for badges.
