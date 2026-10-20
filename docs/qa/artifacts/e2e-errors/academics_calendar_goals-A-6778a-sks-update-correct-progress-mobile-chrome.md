# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: academics_calendar_goals.spec.ts >> Academics, Calendar & Goals Functional Audit >> Goal milestones and linked tasks update correct progress
- Location: tests\e2e\academics_calendar_goals.spec.ts:98:3

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e3]:
    - link "Skip to content" [ref=f1e4] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=f1e5]:
      - banner [ref=f1e6]:
        - link "Nemo overview" [ref=f1e7] [cursor=pointer]:
          - /url: /overview
          - generic [ref=f1e9]: nemo.
        - generic [ref=f1e10]:
          - button "Quick Add" [ref=f1e11] [cursor=pointer]
          - link "Profile and settings" [ref=f1e13] [cursor=pointer]:
            - /url: /settings
            - text: MW
      - generic [ref=f1e14]:
        - generic [ref=f1e15]: Personal workspace · Saved on this device
        - button "Explore demo" [ref=f1e19] [cursor=pointer]
      - main [ref=f1e22]:
        - generic [ref=f1e24]:
          - generic [ref=f1e25]:
            - generic [ref=f1e32]:
              - heading "Long-term Goals" [level=2] [ref=f1e33]
              - paragraph [ref=f1e34]: Track major objectives, measure progress through verified milestones, and connect everyday tasks.
            - button "New Goal" [ref=f1e35] [cursor=pointer]
          - generic [ref=f1e38]:
            - button "all 0" [ref=f1e39] [cursor=pointer]:
              - generic [ref=f1e40]: all
              - generic [ref=f1e41]: "0"
            - button "active 0" [ref=f1e42] [cursor=pointer]:
              - generic [ref=f1e43]: active
              - generic [ref=f1e44]: "0"
            - button "planned 0" [ref=f1e45] [cursor=pointer]:
              - generic [ref=f1e46]: planned
              - generic [ref=f1e47]: "0"
            - button "paused 0" [ref=f1e48] [cursor=pointer]:
              - generic [ref=f1e49]: paused
              - generic [ref=f1e50]: "0"
            - button "achieved 0" [ref=f1e51] [cursor=pointer]:
              - generic [ref=f1e52]: achieved
              - generic [ref=f1e53]: "0"
          - generic [ref=f1e54]:
            - heading "No goals found" [level=3] [ref=f1e60]
            - paragraph [ref=f1e61]: Define clear goals, attach measurable milestones, and associate existing tasks without cloning data.
            - button "Add Goal" [ref=f1e62] [cursor=pointer]
    - navigation "Mobile Navigation" [ref=f1e63]:
      - link "Today" [ref=f1e64] [cursor=pointer]:
        - /url: /overview
      - link "Projects" [ref=f1e71] [cursor=pointer]:
        - /url: /projects
      - link "Tasks" [ref=f1e78] [cursor=pointer]:
        - /url: /tasks
      - link "Calendar" [ref=f1e83] [cursor=pointer]:
        - /url: /calendar
      - button "Open more navigation options" [ref=f1e87] [cursor=pointer]:
        - generic [ref=f1e92]: More
  - dialog "Dialog" [ref=f1e94]:
    - button "Close dialog" [ref=f1e96] [cursor=pointer]
    - generic [ref=f1e100]:
      - generic [ref=f1e101]:
        - img "Nemo" [ref=f1e103]
        - heading "Welcome to nemo." [level=2] [ref=f1e104]
        - paragraph [ref=f1e105]: Track it, finish it.
      - generic [ref=f1e106]:
        - paragraph [ref=f1e111]:
          - strong [ref=f1e112]: "100% Private & Browser-Local:"
          - text: Your workspace lives entirely inside this browser via IndexedDB. No accounts, no analytics, no external tracking.
        - paragraph [ref=f1e116]:
          - strong [ref=f1e117]: "No Automatic Cloud Sync:"
          - text: Your data never leaves this device without your action.
        - paragraph [ref=f1e123]:
          - strong [ref=f1e124]: "Portable Backups:"
          - text: Export your full database and images with a single click anytime in Settings to keep it safe or move between devices.
      - generic [ref=f1e126]:
        - generic [ref=f1e127]: Workspace / Display Name
        - textbox "Workspace / Display Name" [active] [ref=f1e128]:
          - /placeholder: e.g. Alex's Workspace
          - text: My Workspace
      - generic [ref=f1e129]:
        - button "Skip customization" [ref=f1e130] [cursor=pointer]
        - button "Start Workspace" [ref=f1e131] [cursor=pointer]
```