const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const User = mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true }));

const Workspace = mongoose.model("Workspace", new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true }));

const Project = mongoose.model("Project", new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#7c3aed" },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  description: String,
  dueDate: String
}, { timestamps: true }));

const Task = mongoose.model("Task", new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ["todo", "progress", "done"], default: "todo" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  dueDate: String
}, { timestamps: true }));

const Activity = mongoose.model("Activity", new mongoose.Schema({
  text: String,
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }
}, { timestamps: true }));

const sign = id => jwt.sign({ id }, process.env.JWT_SECRET || "dev-secret");

async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Login required" });
    const data = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = await User.findById(data.id);
    if (!req.user) throw new Error();
    next();
  } catch {
    res.status(401).json({ message: "Invalid session" });
  }
}

async function activity(workspace, text) {
  await Activity.create({ workspace, text });
}

app.get("/api/health", (_, res) => res.json({ ok: true, message: "Team Workspace API is running" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("REGISTER REQUEST:", {
      name,
      email,
      passwordReceived: !!password
    });

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    console.log(
      "USER CREATED:",
      user.email
    );

    const token = sign(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error(
      "REGISTRATION ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Registration failed"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    res.json({ token: sign(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/me", auth, (req, res) => res.json({ id: req.user._id, name: req.user.name, email: req.user.email }));

app.get("/api/workspace", auth, async (req, res) => {
  let workspace = await Workspace.findOne({ members: req.user._id }).populate("members", "name email");
  if (!workspace) {
    workspace = await Workspace.create({
      name: "My Team",
      description: "Your collaborative workspace",
      owner: req.user._id,
      members: [req.user._id]
    });
    workspace = await workspace.populate("members", "name email");
  }
  res.json(workspace);
});

app.patch("/api/workspace", auth, async (req, res) => {
  const workspace = await Workspace.findOneAndUpdate(
    { members: req.user._id },
    { $set: { name: req.body.name, description: req.body.description } },
    { new: true }
  ).populate("members", "name email");
  res.json(workspace);
});

app.post("/api/workspace/members", auth, async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  const workspace = await Workspace.findOne({ members: req.user._id });
  if (!user) return res.status(404).json({ message: "User not found. Ask them to register first." });
  if (workspace.members.some(id => id.toString() === user._id.toString()))
    return res.status(400).json({ message: "Already a member" });
  workspace.members.push(user._id);
  await workspace.save();
  await activity(workspace._id, `${req.user.name} added ${user.name} to the team`);
  res.json(await workspace.populate("members", "name email"));
});

app.get("/api/data", auth, async (req, res) => {
  const workspace = await Workspace.findOne({ members: req.user._id });
  if (!workspace) return res.json({ projects: [], tasks: [], activities: [], members: [] });
  const [projects, tasks, activities] = await Promise.all([
    Project.find({ workspace: workspace._id }).sort("-createdAt"),
    Task.find({ workspace: workspace._id }).populate("assignee", "name email").populate("project", "name color").sort("-createdAt"),
    Activity.find({ workspace: workspace._id }).sort("-createdAt").limit(12)
  ]);
  res.json({ projects, tasks, activities, members: workspace.members });
});

app.post("/api/projects", auth, async (req, res) => {
  const workspace = await Workspace.findOne({ members: req.user._id });
  const project = await Project.create({ ...req.body, workspace: workspace._id });
  await activity(workspace._id, `${req.user.name} created project "${project.name}"`);
  res.json(project);
});

app.delete("/api/projects/:id", auth, async (req, res) => {
  const workspace = await Workspace.findOne({ members: req.user._id });
  await Task.deleteMany({ project: req.params.id });
  await Project.deleteOne({ _id: req.params.id, workspace: workspace._id });
  await activity(workspace._id, `${req.user.name} deleted a project`);
  res.json({ ok: true });
});

app.post("/api/tasks", auth, async (req, res) => {
  const workspace = await Workspace.findOne({ members: req.user._id });
  const task = await Task.create({ ...req.body, workspace: workspace._id });
  await activity(workspace._id, `${req.user.name} created task "${task.title}"`);
  res.json(await task.populate(["assignee", "project"]));
});

app.patch("/api/tasks/:id", auth, async (req, res) => {
  const workspace = await Workspace.findOne({ members: req.user._id });
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, workspace: workspace._id },
    { $set: req.body },
    { new: true }
  ).populate("assignee", "name email").populate("project", "name color");
  await activity(workspace._id, `${req.user.name} updated "${task.title}"`);
  res.json(task);
});

app.delete("/api/tasks/:id", auth, async (req, res) => {
  const workspace = await Workspace.findOne({ members: req.user._id });
  await Task.deleteOne({ _id: req.params.id, workspace: workspace._id });
  res.json({ ok: true });
});

app.post("/api/seed", auth, async (req, res) => {
  const workspace = await Workspace.findOne({ members: req.user._id });
  if (await Project.countDocuments({ workspace: workspace._id })) return res.json({ message: "Demo data already exists" });
  const projects = await Project.insertMany([
    { name: "Website Redesign", color: "#7c3aed", description: "Refresh the public website", workspace: workspace._id },
    { name: "Mobile App", color: "#0891b2", description: "Build the companion app", workspace: workspace._id },
    { name: "Marketing", color: "#ea580c", description: "Launch campaign assets", workspace: workspace._id }
  ]);
  await Task.insertMany([
    { title: "Create landing page", status: "progress", priority: "high", project: projects[0]._id, workspace: workspace._id, assignee: req.user._id },
    { title: "Design dashboard", status: "todo", priority: "medium", project: projects[0]._id, workspace: workspace._id },
    { title: "Set up authentication", status: "done", priority: "high", project: projects[1]._id, workspace: workspace._id, assignee: req.user._id },
    { title: "Prepare launch post", status: "todo", priority: "low", project: projects[2]._id, workspace: workspace._id }
  ]);
  await activity(workspace._id, `${req.user.name} loaded demo workspace data`);
  res.json({ ok: true });
});

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/team_workspace")
  .then(() => app.listen(process.env.PORT || 5000, () => console.log(`API running on http://localhost:${process.env.PORT || 5000}`)))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
