FIREBASE INTEGRATION NOTES
==========================
I updated the project to use a single clean Firebase initialization.

Files added/modified:
- src/firebase.js        (clean modular v10 init)
- src/lib/auth.js       (signup/signin wrappers)
- .env.local            (Firebase keys - placed at project root)

How to run:
1. cd into this folder (where package.json exists): /mnt/data/pathfinder_work/shillong-swift-tours-main/shillong-swift-tours-main
2. npm install
3. npm run dev
4. Open the app in Chrome and use the Auth UI to sign up / sign in.
