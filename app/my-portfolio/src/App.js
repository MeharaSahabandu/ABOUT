import React, { useState, useRef, useEffect } from "react";
import "./styles/about.css";

const About = () => {
  const [history, setHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentDir, setCurrentDir] = useState("~");
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef(null);
  const terminalBodyRef = useRef(null);
  const inputLineRef = useRef(null);

  const fileSystem = {
    "~": {
      type: "dir",
      contents: {
        about: {
          type: "dir",
          contents: {
            "about.txt": {
              type: "file",
              content: [
                "==================================",
                "    SITE RELIABILITY ENGINEER",
                "==================================",
                "",
                "I'm a Site Reliability Engineer at IFS who is passionate about building scalable and reliable systems that keep applications running smoothly 24/7.",
                "With a background in full-stack development, I have experience in developing web and mobile applications, and now I specialize in SRE practices, and cloud infrastructure.",
                "",
              ],
            },
            "experience.txt": {
              type: "file",
              content: [
                "→ Intern Software Engineer - Insharp Technologies (2023 March - 2023 Aug)",
                "→ Associate Site Reliability Engineer (2024 Feb - 2025 Sep)",
                "→ Site Reliability Engineer (2025 Sep - Present)",
              ],
            },
            "education.txt": {
              type: "file",
              content: [
                "🎓 EDUCATION",
                "─────────────────────────────────────",
                "BSc (Hons) in Information Technology Specialising in Software Engineering (2021-2024)",
                "",
                "- Sri Lanka Institute of Information Technology (SLIIT)",
                "",
              ],
            },
          },
        },
        "skills.txt": {
          type: "file",
          content: [
            "💻 TECHNICAL EXPERTISE",
            "─────────────────────────────────────",
            "→ Infrastructure & Cloud Management",
            "→ Monitoring & Alerting Systems",
            "→ Web & Mobile Application Development",
            "→ Level 1 Support for SOC",
            "",
          ],
        },
        "contact.txt": {
          type: "file",
          content: [
            "CONTACT INFORMATION",
            "─────────────────────────────────────",
            "Email: sahabandumehara@gmail.com",
            "GitHub: github.com/MeharaSahabandu",
            "LinkedIn: linkedin.com/in/mehara-sahabandu",
            "Phone: +94 77 615 0928",
            "",
          ],
        },
      },
    },
  };

  const helpText = [
    "Available commands:",
    "  ls              - list files and directories",
    "  cd <dir>        - change directory",
    "  cat <file>      - display file contents",
    "  pwd             - print working directory",
    "  clear           - clear terminal",
    "  help            - show this help message",
    "",
  ];

  const getCurrentDirContents = () => {
    const parts = currentDir.split("/").filter((p) => p);
    let current = fileSystem["~"];

    for (const part of parts) {
      if (part === "~") continue;
      current = current.contents[part];
      if (!current) return null;
    }

    return current.contents || current;
  };

  const animateOutput = async (lines, commandText, commandDir) => {
    setIsAnimating(true);

    // Add command to history first
    setHistory((prev) => [
      ...prev,
      { type: "command", text: commandText, dir: commandDir },
      { type: "output", text: [], isAnimating: true },
    ]);

    //animation
    for (let i = 0; i < lines.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150)); // Delay between lines

      setHistory((prev) => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        newHistory[lastIndex] = {
          ...newHistory[lastIndex],
          text: [...newHistory[lastIndex].text, lines[i]],
        };
        return newHistory;
      });
    }

    // Mark animation as complete
    setHistory((prev) => {
      const newHistory = [...prev];
      const lastIndex = newHistory.length - 1;
      newHistory[lastIndex] = {
        ...newHistory[lastIndex],
        isAnimating: false,
      };
      return newHistory;
    });

    setIsAnimating(false);
  };

  const processCommand = async (cmd) => {
    const trimmedCmd = cmd.trim();
    let output = [];
    let shouldAnimate = false;

    if (trimmedCmd === "") {
      return { output: [], animate: false };
    } else if (trimmedCmd === "help") {
      output = helpText;
    } else if (trimmedCmd === "pwd") {
      output = [currentDir];
    } else if (trimmedCmd === "ls") {
      const contents = getCurrentDirContents();
      if (contents) {
        output = Object.keys(contents).map((name) => {
          const item = contents[name];
          return item.type === "dir" ? `${name}/` : name;
        });
      }
    } else if (trimmedCmd.startsWith("cd ")) {
      const target = trimmedCmd.substring(3).trim();

      if (target === "..") {
        const parts = currentDir.split("/").filter((p) => p);
        if (parts.length > 1 || (parts.length === 1 && parts[0] !== "~")) {
          parts.pop();
          setCurrentDir(parts.length === 0 ? "~" : parts.join("/"));
        }
        return { output: [], animate: false, skipHistory: true };
      } else if (target === "~" || target === "/") {
        setCurrentDir("~");
        return { output: [], animate: false, skipHistory: true };
      } else {
        const contents = getCurrentDirContents();
        if (contents && contents[target] && contents[target].type === "dir") {
          const newDir =
            currentDir === "~" ? `~/${target}` : `${currentDir}/${target}`;
          setCurrentDir(newDir);
          return { output: [], animate: false, skipHistory: true };
        } else {
          output = [`cd: ${target}: No such directory`];
        }
      }
    } else if (trimmedCmd === "clear") {
      setHistory([]);
      return { output: [], animate: false, skipHistory: true };
    } else if (trimmedCmd.startsWith("cat ")) {
      const filename = trimmedCmd.substring(4).trim();
      const contents = getCurrentDirContents();

      if (
        contents &&
        contents[filename] &&
        contents[filename].type === "file"
      ) {
        output = contents[filename].content;
        shouldAnimate = true;
      } else {
        output = [`cat: ${filename}: No such file or directory`];
      }
    } else {
      output = [
        `bash: ${trimmedCmd}: command not found`,
        "Type 'help' for available commands",
      ];
    }

    return { output, animate: shouldAnimate };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isAnimating) return; // Prevent new commands during animation

    const commandText = currentInput;
    const commandDir = currentDir;
    setCurrentInput("");

    const result = await processCommand(commandText);

    if (result.skipHistory) {
      return;
    }

    if (result.animate) {
      await animateOutput(result.output, commandText, commandDir);
    } else {
      setHistory([
        ...history,
        { type: "command", text: commandText, dir: commandDir },
        { type: "output", text: result.output },
      ]);
    }
  };

  useEffect(() => {
    // Scroll to the input line
    if (inputLineRef.current) {
      inputLineRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    // Keep focus on input
    if (!isAnimating) {
      inputRef.current?.focus();
    }
  }, [history, currentDir, isAnimating]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTerminalClick = () => {
    if (!isAnimating) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="terminal-container" onClick={handleTerminalClick}>
      <div className="terminal-welcome">
        <p>Hi! It's Mehara here..</p>
        <p>Type 'help' for available commands.</p>
        <p>─────────────────────────────────────</p>
        <br />
      </div>

      <div className="terminal-body" ref={terminalBodyRef}>
        {history.map((item, index) => (
          <div key={index}>
            {item.type === "command" && (
              <div className="terminal-line command">
                <span className="prompt-symbol">sahabandu@portfolio</span>
                <span className="prompt-colon">:</span>
                <span className="prompt-path">{item.dir}</span>
                <span className="prompt-dollar">$</span> {item.text}
              </div>
            )}
            {item.type === "output" && (
              <div className="terminal-output">
                {item.text.map((line, i) => (
                  <div key={i} className="output-text">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="terminal-input-line"
        ref={inputLineRef}
      >
        <div className="terminal-line command">
          <span className="prompt-symbol">sahabandu@portfolio</span>
          <span className="prompt-colon">:</span>
          <span className="prompt-path">{currentDir}</span>
          <span className="prompt-dollar">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="terminal-input"
            autoFocus
            spellCheck="false"
            autoComplete="off"
            disabled={isAnimating}
          />
        </div>
      </form>
    </div>
  );
};

export default About;
