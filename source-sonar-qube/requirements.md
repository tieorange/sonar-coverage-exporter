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
----
Refactor code to use Clean code architecture. Also use classes and OOP approach. I am flutter/android dev. and not used to so much functions. I am used to OOP and classes, etc. Make code more readable also

----
Our extension should include in reports only New uncovered code (so the code that was added in my branch only).
Old uncovered code should not be included in our reports
New code in webpage marked with blue color background (under the code) and when you hover mouse over this blue background and code - it says "New code"
Check source code of pages examples:
- source-sonar-qube/master-page 2 .html
- source-sonar-qube/master-page.html