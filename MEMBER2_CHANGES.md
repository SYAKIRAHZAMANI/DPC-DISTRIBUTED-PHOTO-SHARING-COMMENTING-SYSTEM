# Member 2 (Backend & Logic) changes

## New features
- Friend groups: create a group, join with an invite code, leave, delete (owner), see members.
  Users only see photos from people who share at least one group with them.
- Comment management: edit your own comments; delete your own comments or any comment on your own photo.
- Threaded replies: Reply button under every comment; replies are shown indented (one level, like Instagram).
  Deleting a comment also deletes its replies; a reply can never attach to a comment deleted at the same moment.
- Search now also matches comment text; uploader search now runs inside MongoDB (fixes missed results beyond the newest 100 photos).
- Frontend: new "Friend groups" page and nav link; edit/delete buttons on comments.

## Concurrency and reliability
- Comments are added with one atomic `$push`; group joins use atomic `$addToSet`.
- Ownership checks are part of the update query itself (no check-then-write gap).
- MongoDB connection pool (maxPoolSize 20); new index on uploader + createdAt.
- Request logging with user and response time (logs/access.log), security headers (helmet),
  login/register rate limit (AUTH_RATE_LIMIT).
- /api/health now reports database status, instance, uptime and memory.

## New API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/groups | My groups |
| POST | /api/groups | Create group |
| POST | /api/groups/join | Join with invite code |
| POST | /api/groups/:id/leave | Leave group |
| DELETE | /api/groups/:id | Delete group (owner) |
| POST | /api/photos/:id/comments (body: text, parentId) | Reply to a comment |
| PUT | /api/photos/:id/comments/:commentId | Edit own comment |
| DELETE | /api/photos/:id/comments/:commentId | Delete comment |
| GET | /api/photos?group=<id> | Feed for one group only |

## Load testing
    node loadtest/seed.mjs <API_URL> 50
    node loadtest/concurrency-test.mjs 10
