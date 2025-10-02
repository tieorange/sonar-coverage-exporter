Problem: I need to export the sonarQube tests coverage report and feed it to github copilot or roocode (agentic coding tools)
So AI can know what lines of code needs to be covered with tests

Create a chrome extension in typescript that does parse the website and exports readable .md file showing what new lines of code are not covered with tests

Source code of sonarQube are in this folder - read all files - `/source-sonar-qube`

Analyze html code of source pages deeply, so you can generate a readable .md file reports that I can pass to LLM and it will write missing tests for me. Those reports should include a good prompt also, so I can just copy-paste it to github copilot or Cursor IDE

-----
Improve the prompt that we generated. And add to prompt such text:
"Follow tests examples in our codebase and /docs/ folder and follow rules in the .cursorrules file"

- It works. I made a report. they are in /reports/ folder. Analyze them and improve the code to improve the report generation. Those reports should be clear for people and other LLMs. Add emojis to report