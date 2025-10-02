Problem: I need to export the sonarQube tests coverage report and feed it to github copilot or roocode (agentic coding tools)
So AI can know what lines of code needs to be covered with tests

Create a chrome extension in typescript that does parse the website and exports readable .md file showing what new lines of code are not covered with tests

Source code of sonarQube are in this folder - read all files - `/source-sonar-qube`

Analyze html code of source pages deeply, so you can generate a readable .md file reports that I can pass to LLM and it will write missing tests for me. Those reports should include a good prompt also, so I can just copy-paste it to github copilot or Cursor IDE

-----
Improve the prompt that we generated. And add to prompt such text:
"Follow tests examples in our codebase and /docs/ folder and follow rules in the .cursorrules file"

- It works. I made a report. they are in /reports/ folder. Analyze them and improve the code to improve the report generation. Those reports should be clear for people and other LLMs. Add emojis to report

-----
Now our extension can download only 1 report for 1 file.
Make our extension to be able to download all file reports and merge it into 1 readable .md file report that includes all files that sonarQube showed as (that needs to increase coverage)
Source code of main page of SonarQube - `source-sonar-qube/master-page.html`

-----
What is wrong with my prompt? my AI tools don't add tests. They should write tests for me (my tools has such ability - you just need to ask them):
tests.md - increase tests coverage for those

• Explored
  └ Read tests.md

• Added tests.md (+21 -0)
    1     +# Manual Test Checklist for AirPods Fix
    2     +
    3     +The automated tests cover happy-path and error-path logic for `AudioSettings` and
            `SoundRecorder`. The following manual verifications help ensure the feature beha
           ves correctly on real devices:
    4     +
    5     +1. **AirPods routing enabled**
    6     +   - Toggle the remote feature flag `enable-airpods-experimental-fix` to `true`.
    7     +   - Launch the app on iOS with AirPods connected.
    8     +   - Start a practice session and begin recording; confirm audio input switches t
           o the AirPods microphone.
    9     +
    10    +2. **AirPods routing disabled**
    11    +   - Toggle the flag to `false`.
    12    +  - Start a recording and background/foreground the app; ensure the recorder does
            not attempt to reconfigure audio and the session remains stable.
    13    +
    14    +3. **Lifecycle cancellation**
    15    +   - With the flag enabled, start recording, then background and return to the ap
           p; verify the recording is cancelled and the UI returns to idle state.
    16    +
    17    +4. **Bluetooth device change**
    18    +   - While recording with the flag enabled, disconnect and reconnect AirPods; con
           firm the recorder cancels and restarts gracefully, routing audio correctly when t
           he connection resumes.
    19    +
    20    +5. **Permission denied**
    21    +   - Revoke microphone permissions in iOS settings, start a recording, and confir
           m the app surfaces the no-permission dialog and the recorder returns to the initi
           al state.

> Manual QA Checklist (new in tests.md)

  - Added a dedicated checklist describing how to manually exercise the AirPods routing
  feature:
      - Flag ON: confirm routing to AirPods when recording.
      - Flag OFF: ensure no audio session reconfiguration and the session stays stable.
      - Lifecycle resume: verify recording cancels when returning to the app.
      - Bluetooth device changes: make sure cancel/restart works when AirPods disconnect/
  reconnect.
      - Permission denied: confirm UI handles missing mic access.

  No code changes—just guidance for manual testing on top of the improved automated
  coverage.
----
Refactor code to use Clean code architecture. Also use classes and OOP approach. I am flutter/android dev. and not used to so much functions. I am used to OOP and classes, etc. Make code more readable also

