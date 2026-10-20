# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: academics_calendar_goals.spec.ts >> Academics, Calendar & Goals Functional Audit >> Calendar events and projected deadlines remain accurate
- Location: tests\e2e\academics_calendar_goals.spec.ts:56:3

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
            - heading "Tasks" [level=1] [ref=f1e26]
            - paragraph [ref=f1e27]: Small steps. Clear priorities.
          - generic [ref=f1e28]:
            - textbox "Search tasks by title, notes, or tags..." [ref=f1e34]
            - button "New Task" [ref=f1e35] [cursor=pointer]
          - generic [ref=f1e38]:
            - button "All Tasks 0" [pressed] [ref=f1e39] [cursor=pointer]:
              - generic [ref=f1e40]: All Tasks
              - generic [ref=f1e41]: "0"
            - button "Due Today 0" [ref=f1e42] [cursor=pointer]:
              - generic [ref=f1e43]: Due Today
              - generic [ref=f1e44]: "0"
            - button "Upcoming 0" [ref=f1e45] [cursor=pointer]:
              - generic [ref=f1e46]: Upcoming
              - generic [ref=f1e47]: "0"
            - button "Overdue 0" [ref=f1e48] [cursor=pointer]:
              - generic [ref=f1e49]: Overdue
              - generic [ref=f1e50]: "0"
            - button "Completed 0" [ref=f1e51] [cursor=pointer]:
              - generic [ref=f1e52]: Completed
              - generic [ref=f1e53]: "0"
          - generic [ref=f1e54]:
            - heading "No tasks in this view" [level=3] [ref=f1e59]
            - paragraph [ref=f1e60]: Add tasks to organize daily actions, link them to projects, or track academic assignments.
            - button "Add Task" [ref=f1e61] [cursor=pointer]
    - navigation "Mobile Navigation" [ref=f1e62]:
      - link "Today" [ref=f1e63] [cursor=pointer]:
        - /url: /overview
      - link "Projects" [ref=f1e70] [cursor=pointer]:
        - /url: /projects
      - link "Tasks" [ref=f1e77] [cursor=pointer]:
        - /url: /tasks
      - link "Calendar" [ref=f1e82] [cursor=pointer]:
        - /url: /calendar
      - button "Open more navigation options" [ref=f1e86] [cursor=pointer]:
        - generic [ref=f1e91]: More
  - dialog "Dialog" [ref=f1e93]:
    - button "Close dialog" [ref=f1e95] [cursor=pointer]
    - generic [ref=f1e99]:
      - generic [ref=f1e100]:
        - img "Nemo" [ref=f1e102]
        - heading "Welcome to nemo." [level=2] [ref=f1e103]
        - paragraph [ref=f1e104]: Track it, finish it.
      - generic [ref=f1e105]:
        - paragraph [ref=f1e110]:
          - strong [ref=f1e111]: "100% Private & Browser-Local:"
          - text: Your workspace lives entirely inside this browser via IndexedDB. No accounts, no analytics, no external tracking.
        - paragraph [ref=f1e115]:
          - strong [ref=f1e116]: "No Automatic Cloud Sync:"
          - text: Your data never leaves this device without your action.
        - paragraph [ref=f1e122]:
          - strong [ref=f1e123]: "Portable Backups:"
          - text: Export your full database and images with a single click anytime in Settings to keep it safe or move between devices.
      - generic [ref=f1e125]:
        - generic [ref=f1e126]: Workspace / Display Name
        - textbox "Workspace / Display Name" [active] [ref=f1e127]:
          - /placeholder: e.g. Alex's Workspace
          - text: My Workspace
      - generic [ref=f1e128]:
        - button "Skip customization" [ref=f1e129] [cursor=pointer]
        - button "Start Workspace" [ref=f1e130] [cursor=pointer]
```