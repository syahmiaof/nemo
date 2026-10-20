# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: database_backup_demo.spec.ts >> Privacy, Database & Demo Functional Audit >> Backup validation rejects malformed JSON and preserves database
- Location: tests\e2e\database_backup_demo.spec.ts:69:3

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
            - heading "Settings" [level=1] [ref=f1e26]
            - paragraph [ref=f1e27]: Make this space yours.
          - tablist "Settings sections" [ref=f1e29]:
            - tab "Appearance" [selected] [ref=f1e30] [cursor=pointer]
            - tab "Profile" [ref=f1e38] [cursor=pointer]
            - tab "Preferences" [ref=f1e43] [cursor=pointer]
            - tab "Data & Backups" [ref=f1e46] [cursor=pointer]
            - tab "Demo Mode" [ref=f1e50] [cursor=pointer]
          - tabpanel "Appearance" [ref=f1e54]:
            - generic [ref=f1e55]:
              - generic [ref=f1e56]:
                - generic [ref=f1e64]:
                  - heading "Theme Atmosphere" [level=3] [ref=f1e65]
                  - paragraph [ref=f1e66]: "Choose your ambient workspace palette: Midnight, Daylight, or Aurora."
                - generic [ref=f1e67]:
                  - button "Midnight Active Midnight navy foundation with warm peach and soft mint accents." [ref=f1e68] [cursor=pointer]:
                    - generic [ref=f1e69]:
                      - generic [ref=f1e70]: Midnight
                      - generic [ref=f1e74]: Active
                    - paragraph [ref=f1e81]: Midnight navy foundation with warm peach and soft mint accents.
                  - button "Daylight High-contrast daylight canvas with dark slate typography and crisp surfaces." [ref=f1e82] [cursor=pointer]:
                    - generic [ref=f1e83]: Daylight
                    - paragraph [ref=f1e98]: High-contrast daylight canvas with dark slate typography and crisp surfaces.
                  - button "Aurora Atmospheric deep navy with flowing ambient aurora gradients and glass layering." [ref=f1e99] [cursor=pointer]:
                    - generic [ref=f1e100]: Aurora
                    - paragraph [ref=f1e111]: Atmospheric deep navy with flowing ambient aurora gradients and glass layering.
              - generic [ref=f1e112]:
                - generic [ref=f1e116]:
                  - heading "Signature Brand Experience" [level=3] [ref=f1e117]
                  - paragraph [ref=f1e118]: The official flowing route emblem initialization, mint checkpoint, and peach completion reveal.
                - generic [ref=f1e119]:
                  - generic [ref=f1e120]:
                    - paragraph [ref=f1e121]: Welcome Launch Animation
                    - paragraph [ref=f1e122]: Replays the initial brand welcome overlay with full spatial route drawing.
                  - button "Replay Welcome Animation" [ref=f1e123] [cursor=pointer]
    - navigation "Mobile Navigation" [ref=f1e127]:
      - link "Today" [ref=f1e128] [cursor=pointer]:
        - /url: /overview
      - link "Projects" [ref=f1e135] [cursor=pointer]:
        - /url: /projects
      - link "Tasks" [ref=f1e142] [cursor=pointer]:
        - /url: /tasks
      - link "Calendar" [ref=f1e147] [cursor=pointer]:
        - /url: /calendar
      - button "Open more navigation options" [ref=f1e151] [cursor=pointer]:
        - generic [ref=f1e156]: More
  - dialog "Dialog" [ref=f1e158]:
    - button "Close dialog" [ref=f1e160] [cursor=pointer]
    - generic [ref=f1e164]:
      - generic [ref=f1e165]:
        - img "Nemo" [ref=f1e167]
        - heading "Welcome to nemo." [level=2] [ref=f1e168]
        - paragraph [ref=f1e169]: Track it, finish it.
      - generic [ref=f1e170]:
        - paragraph [ref=f1e175]:
          - strong [ref=f1e176]: "100% Private & Browser-Local:"
          - text: Your workspace lives entirely inside this browser via IndexedDB. No accounts, no analytics, no external tracking.
        - paragraph [ref=f1e180]:
          - strong [ref=f1e181]: "No Automatic Cloud Sync:"
          - text: Your data never leaves this device without your action.
        - paragraph [ref=f1e187]:
          - strong [ref=f1e188]: "Portable Backups:"
          - text: Export your full database and images with a single click anytime in Settings to keep it safe or move between devices.
      - generic [ref=f1e190]:
        - generic [ref=f1e191]: Workspace / Display Name
        - textbox "Workspace / Display Name" [active] [ref=f1e192]:
          - /placeholder: e.g. Alex's Workspace
          - text: My Workspace
      - generic [ref=f1e193]:
        - button "Skip customization" [ref=f1e194] [cursor=pointer]
        - button "Start Workspace" [ref=f1e195] [cursor=pointer]
```