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
    - complementary "Global Utility Rail" [ref=f1e5]:
      - button "Search workspace" [ref=f1e6] [cursor=pointer]:
        - generic: Search (Ctrl+K)
      - button "Quick Add" [ref=f1e10] [cursor=pointer]
      - button "Ask Nemo Assistant" [ref=f1e13] [cursor=pointer]:
        - generic: Ask Nemo
      - link "Today's Focus" [ref=f1e17] [cursor=pointer]:
        - /url: /overview#todays-focus
      - link "Settings" [ref=f1e21] [cursor=pointer]:
        - /url: /settings
    - generic [ref=f1e25]:
      - banner [ref=f1e26]:
        - link "Nemo overview" [ref=f1e27] [cursor=pointer]:
          - /url: /overview
          - generic [ref=f1e29]: nemo.
        - navigation "Main Navigation" [ref=f1e31]:
          - generic [ref=f1e32]:
            - link "Overview" [ref=f1e33] [cursor=pointer]:
              - /url: /overview
            - link "Projects" [ref=f1e34] [cursor=pointer]:
              - /url: /projects
            - link "Tasks" [ref=f1e35] [cursor=pointer]:
              - /url: /tasks
            - link "Calendar" [ref=f1e36] [cursor=pointer]:
              - /url: /calendar
            - link "Academics" [ref=f1e37] [cursor=pointer]:
              - /url: /academics
            - link "Goals" [ref=f1e38] [cursor=pointer]:
              - /url: /goals
            - link "Insights" [ref=f1e39] [cursor=pointer]:
              - /url: /insights
        - generic [ref=f1e40]:
          - button "Quick Add" [ref=f1e41] [cursor=pointer]
          - link "Profile and settings" [ref=f1e43] [cursor=pointer]:
            - /url: /settings
            - text: MW
      - generic [ref=f1e44]:
        - generic [ref=f1e45]: Personal workspace · Saved on this device
        - button "Explore demo" [ref=f1e49] [cursor=pointer]
      - main [ref=f1e52]:
        - generic [ref=f1e54]:
          - generic [ref=f1e55]:
            - heading "Settings" [level=1] [ref=f1e56]
            - paragraph [ref=f1e57]: Make this space yours.
          - tablist "Settings sections" [ref=f1e59]:
            - tab "Appearance" [selected] [ref=f1e60] [cursor=pointer]
            - tab "Profile" [ref=f1e68] [cursor=pointer]
            - tab "Preferences" [ref=f1e73] [cursor=pointer]
            - tab "Data & Backups" [ref=f1e76] [cursor=pointer]
            - tab "Demo Mode" [ref=f1e80] [cursor=pointer]
          - tabpanel "Appearance" [ref=f1e84]:
            - generic [ref=f1e85]:
              - generic [ref=f1e86]:
                - generic [ref=f1e94]:
                  - heading "Theme Atmosphere" [level=3] [ref=f1e95]
                  - paragraph [ref=f1e96]: "Choose your ambient workspace palette: Midnight, Daylight, or Aurora."
                - generic [ref=f1e97]:
                  - button "Midnight Active Midnight navy foundation with warm peach and soft mint accents." [ref=f1e98] [cursor=pointer]:
                    - generic [ref=f1e99]:
                      - generic [ref=f1e100]: Midnight
                      - generic [ref=f1e104]: Active
                    - paragraph [ref=f1e111]: Midnight navy foundation with warm peach and soft mint accents.
                  - button "Daylight High-contrast daylight canvas with dark slate typography and crisp surfaces." [ref=f1e112] [cursor=pointer]:
                    - generic [ref=f1e113]: Daylight
                    - paragraph [ref=f1e128]: High-contrast daylight canvas with dark slate typography and crisp surfaces.
                  - button "Aurora Atmospheric deep navy with flowing ambient aurora gradients and glass layering." [ref=f1e129] [cursor=pointer]:
                    - generic [ref=f1e130]: Aurora
                    - paragraph [ref=f1e141]: Atmospheric deep navy with flowing ambient aurora gradients and glass layering.
              - generic [ref=f1e142]:
                - generic [ref=f1e146]:
                  - heading "Signature Brand Experience" [level=3] [ref=f1e147]
                  - paragraph [ref=f1e148]: The official flowing route emblem initialization, mint checkpoint, and peach completion reveal.
                - generic [ref=f1e149]:
                  - generic [ref=f1e150]:
                    - paragraph [ref=f1e151]: Welcome Launch Animation
                    - paragraph [ref=f1e152]: Replays the initial brand welcome overlay with full spatial route drawing.
                  - button "Replay Welcome Animation" [ref=f1e153] [cursor=pointer]
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