# Critical: Data Persistence

Before EVERY code push, fetch live data from Render:

1. `curl -s https://atharv-site.onrender.com/api/published | python3 -m json.tool > /tmp/live-data.json`
2. If the live data has newer content than the local repo, save it to `data/` files first
3. Then commit and push

Render's deploy key is READ-ONLY. The server's `git push` will always fail unless `GITHUB_TOKEN` is set. Data written to disk by the admin panel is LOST on every deploy unless it's in git first.
