// Intentionally vulnerable example file for SAST/demo use only.
const express = require("express");
const { exec } = require("child_process");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

// Vulnerability: hardcoded secret
const API_KEY = "sk_live_1234567890_example";

const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT)");
  db.run("INSERT INTO users (name, role) VALUES ('alice', 'admin')");
  db.run("INSERT INTO users (name, role) VALUES ('bob', 'user')");
});

app.get("/", (req, res) => {
  res.send("Vulnerable demo app");
});

// Vulnerability: SQL injection
app.get("/user", (req, res) => {
  const name = req.query.name || "";
  const query = `SELECT id, name, role FROM users WHERE name = '${name}'`;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
});

// Vulnerability: command injection
app.get("/ping", (req, res) => {
  const host = req.query.host || "127.0.0.1";
  exec(`ping -c 1 ${host}`, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr || err.message);
    return res.type("text/plain").send(stdout);
  });
});

// Vulnerability: unsafe eval
app.post("/calc", (req, res) => {
  const expression = req.body.expression || "0";
  try {
    const result = eval(expression);
    return res.json({ result });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Vulnerable app listening on http://localhost:3000");
  console.log("Demo API key:", API_KEY);
});
