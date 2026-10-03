# BorrowBack — Never Forget What You Lent

BorrowBack is a simple, account-free web app that helps students remember what they have lent to other people.

Have you ever lent someone a calculator, charger, book, notes, or some other item and later forgotten who has it or when they were supposed to return it?

BorrowBack solves that small but annoying problem by keeping a simple record of your lent items.

---

## The Annoyance

### What is annoying?

I sometimes lend things to friends or classmates and later forget:

* What I lent
* Who currently has it
* When I expected it back
* Whether it has already been returned

This is especially easy to forget with small things such as calculators, chargers, books, notes, or stationery.

### Who is this for?

BorrowBack is mainly designed for:

* Students
* College classmates
* Friends who frequently lend things to each other
* Anyone who wants a simple personal lending tracker

The idea is intentionally small: instead of building a complicated inventory system, BorrowBack focuses on one everyday annoyance — remembering what you lent.

---

## The Constraint

My PRN ends in **0**, so the required constraint was:

> **No accounts. Nobody signs up or logs in, but each person's data is still only theirs.**

This constraint significantly changed the way I designed the application.

I could not use the normal approach of creating accounts and associating data with a user ID.

Instead, BorrowBack creates an anonymous identity automatically.

### How it works

When a user visits the application for the first time:

1. The Express server generates a random UUID.
2. The UUID is stored in an `HttpOnly` cookie.
3. The browser sends that cookie with future requests.
4. The server reads the cookie and identifies the anonymous owner.
5. Database queries are always filtered using that server-generated owner ID.

The client never gets to choose which `owner_id` is used for database queries.

For example:

```text
Browser A
    ↓
Anonymous owner ID A
    ↓
Only owner A's loans

Browser B
    ↓
Anonymous owner ID B
    ↓
Only owner B's loans
```

This allows different browsers to use BorrowBack without creating accounts while keeping their data separated.

### Important limitation

This is anonymous ownership rather than traditional authentication.

If a browser loses its cookie, the user may lose access to the data associated with that anonymous identity.

---

## Features

### Add a lent item

Users can record:

* Item name
* Person who has it
* Expected return date
* Optional note

### Track lending status

Each item can be:

* Currently lent
* Overdue
* Returned

### Search

Users can search by:

* Item name
* Person's name
* Notes

### Filter

Users can filter the lending history by:

* All items
* Currently lent
* Overdue
* Returned

### Mark as returned

Once an item comes back, it can be marked as returned.

### Delete

Old or unnecessary records can be deleted.

### Responsive design

The interface is designed to work on:

* Laptop
* Desktop
* Mobile phone

---

## What I Think Is Great About BorrowBack

The part I like most is the **account-free private data model**.

The constraint initially seemed restrictive because I could not simply create a login system.

Instead, it made me think about how an application can identify a user without requiring registration.

I implemented anonymous ownership on the server using a generated UUID stored in an `HttpOnly` cookie.

I also made sure that database operations use the server-side owner ID rather than trusting a user ID sent from the frontend.

This made the project more interesting than simply building a CRUD application.

---

## Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* Supabase
* PostgreSQL

### Deployment

* Vercel

### Other tools

* Git
* GitHub
* VS Code

I chose vanilla HTML, CSS and JavaScript instead of React because the application is relatively small and I wanted to focus on the actual problem, backend ownership logic, database interaction and responsive design.

---

## Project Structure

```text
BorrowBack/
│
├── api/
│   └── index.js
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── supabase.sql
├── vercel.json
└── README.md
```

The real `.env` file is intentionally not included in the repository.

---

## Privacy / Data Ownership

BorrowBack does not require:

* Email
* Password
* Username
* Sign-up
* Login

Instead, the backend generates an anonymous UUID for each browser.

The server stores this ID in an `HttpOnly` cookie.

All database operations use the owner's server-side ID.

For example, retrieving loans uses:

```javascript
.eq("owner_id", req.ownerId)
```

This means the frontend cannot simply choose another owner's ID when requesting data.

The same ownership check is also applied when updating or deleting an item.

---

## Testing With Two People

The assignment requires testing the application with two people who have not previously seen it.

I have not completed the two-person usability test yet, so I have not invented test results.

The testing will focus on whether a new user can independently:

1. Understand what BorrowBack does.
2. Add a lent item.
3. Find the item after adding it.
4. Understand the status of an item.
5. Mark an item as returned.
6. Search and filter the lending history.

After testing, I will record where each tester got stuck and make usability changes based on their actual behaviour.

---

## AI Usage

I used AI as a development assistant throughout the project.

### What I used AI for

I used AI for:

* Brainstorming and refining the project idea
* Planning the application architecture
* Understanding how to satisfy the no-account constraint
* Creating the initial frontend structure
* Writing and reviewing Express API code
* Connecting the application to Supabase
* Debugging JavaScript and Node.js issues
* Improving responsive design
* Understanding Git and GitHub commands
* Planning deployment
* Reviewing implementation decisions
* Writing and improving project documentation

I did not assume that generated code was automatically correct. I tested the application and checked the behaviour of the code while building the project.

### One thing AI got wrong or needed correction

One issue during development was the local-network testing setup.

The application worked correctly on the laptop using:

```text
http://localhost:3000
```

However, opening `localhost` on the phone did not work because `localhost` on the phone refers to the phone itself, not the laptop.

I identified this by testing the application using the laptop's local network IP address:

```text
http://10.81.255.77:3000
```

The application opened successfully on the laptop using that address, confirming that the Express server was running correctly.

I then checked the Windows Firewall and network configuration for phone-to-laptop access.

This helped me understand the difference between a local server running on a computer and making that server accessible from another device on the network.

---

## What Is Not Done Yet

The core application is implemented, but a few things are still pending:

* Two-person usability testing
* Recording actual tester feedback
* Making any usability improvements discovered during testing
* Completing the final deployed URL
* Adding screenshots to the README
* Testing the complete deployed version on both laptop and phone

These are intentionally being completed after the core functionality rather than adding unnecessary features before validating the basic user experience.

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/shruti-dok/BorrowBack.git
cd BorrowBack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Create a `.env` file in the project root.

Required environment variable names:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

The actual values should never be committed to GitHub.

### 4. Set up the database

Open the Supabase SQL Editor and run the SQL contained in:

```text
supabase.sql
```

### 5. Start the application

```bash
npm start
```

The application will run locally at:

```text
http://localhost:3000
```

---

## Environment Variables

The application requires:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
```

The actual values are intentionally not included in this repository.

---

## Deployment

The application is designed to be deployed using Vercel.

**Live URL:**
Deployment link will be added after deployment.

---

## GitHub

Source code:

https://github.com/shruti-dok/BorrowBack

---

## Future Improvements

Possible future improvements include:

* Reminder notifications for overdue items
* Better date-based sorting
* Export lending history
* PWA/mobile installation support
* Optional backup/recovery mechanism
* More detailed lending history
* Improved accessibility
* Better offline handling
* Improved anonymous-data recovery

These features were intentionally left outside the first version so that the core problem could be solved first.

---

## Conclusion

BorrowBack started with a simple annoyance:

> **"I lent something to someone and now I can't remember who has it."**

The project turned that small problem into a complete web application involving:

* Responsive frontend development
* REST API design
* Database integration
* Anonymous user ownership
* Server-side data isolation
* Git/GitHub workflow
* Deployment

The most important design decision was solving the **no-account constraint** without mixing different users' data.

Instead of requiring registration, BorrowBack uses an anonymous server-generated identity and associates each user's lending records with that identity.

This allowed me to satisfy the constraint while keeping the application simple enough for students to use immediately.
