import React, { useEffect, useState } from "react";
const API_BASE_URL = "https://flowspace-api-j2uw.onrender.com";
const API = async (path, options = {}) => {
  const token = localStorage.getItem("flowspace_token");

  const response = await fetch(API_BASE_URL + "/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Server returned ${response.status}`
    );
  }

  return data;
};

/* =========================
   LOGO
========================= */

function Logo() {
  return (
    <div className="logo">
      <span>◆</span> FlowSpace
    </div>
  );
}

/* =========================
   AUTH
========================= */

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint = register
        ? "/auth/register"
        : "/auth/login";

      const data = await API(endpoint, {
        method: "POST",
        body: JSON.stringify(form)
      });

      localStorage.setItem(
        "flowspace_token",
        data.token
      );

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-glow" />

      <section className="auth-card">
        <Logo />

        <p className="eyebrow">
          TEAM COLLABORATION
        </p>

        <h1>
          {register
            ? "Build together."
            : "Welcome back."}
        </h1>

        <p className="muted">
          {register
            ? "Create your workspace and get your team moving."
            : "Your team's work, organized in one place."}
        </p>

        <form onSubmit={submit}>
          {register && (
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            required
          />

          <input
            type="password"
            placeholder="Password (6+ characters)"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            minLength={6}
            required
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="primary wide"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : register
              ? "Create workspace"
              : "Sign in"}

            {!loading && <b> →</b>}
          </button>
        </form>

        <button
          className="link"
          onClick={() => {
            setRegister(!register);
            setError("");

            setForm({
              name: "",
              email: "",
              password: ""
            });
          }}
        >
          {register
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}

/* =========================
   MODAL
========================= */

function Modal({
  title,
  children,
  onClose
}) {
  return (
    <div
      className="overlay"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-head">
          <h2>{title}</h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function Stat({
  label,
  value,
  icon
}) {
  return (
    <div className="stat">
      <span>{icon}</span>

      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}

/* =========================
   TASK ROW
========================= */

function TaskRow({ task }) {
  return (
    <div className="task-row">
      <span
        className={`status-dot ${task.status}`}
      />

      <div className="task-main">
        <b>{task.title}</b>

        <small>
          {task.project?.name ||
            "No project"}
        </small>
      </div>

      <span
        className={`priority ${task.priority}`}
      >
        {task.priority}
      </span>

      <span className="assignee-mini">
        {task.assignee?.name?.[0] ||
          "?"}
      </span>
    </div>
  );
}

/* =========================
   OVERVIEW
========================= */

function Overview({
  data,
  done,
  progress,
  onTask,
  onProject,
  onBoard
}) {
  return (
    <div className="content">
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            TEAM MOMENTUM
          </p>

          <h2>
            Make progress visible.
          </h2>

          <p>
            Plan work, collaborate with
            your team and ship better —
            all from one focused
            workspace.
          </p>

          <div className="hero-buttons">
            <button
              className="primary"
              onClick={onTask}
            >
              + New task
            </button>

            <button
              className="ghost"
              onClick={onProject}
            >
              + New project
            </button>
          </div>
        </div>

        <div
          className="progress-ring"
          style={{
            "--progress": `${progress * 3.6}deg`
          }}
        >
          <div>
            <strong>
              {progress}%
            </strong>

            <span>
              complete
            </span>
          </div>
        </div>
      </section>

      <div className="stats">
        <Stat
          label="Total tasks"
          value={data.tasks.length}
          icon="✓"
        />

        <Stat
          label="Completed"
          value={done}
          icon="◉"
        />

        <Stat
          label="Projects"
          value={data.projects.length}
          icon="◇"
        />

        <Stat
          label="Team members"
          value={data.members.length}
          icon="◎"
        />
      </div>

      <div className="section-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">
                WORK
              </p>

              <h3>
                Recent tasks
              </h3>
            </div>

            <button
              className="link"
              onClick={onBoard}
            >
              View board →
            </button>
          </div>

          {data.tasks
            .slice(0, 5)
            .map((task) => (
              <TaskRow
                key={task._id}
                task={task}
              />
            ))}

          {!data.tasks.length && (
            <Empty text="No tasks yet. Create your first one." />
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">
                ACTIVITY
              </p>

              <h3>
                What's happening
              </h3>
            </div>
          </div>

          {data.activities
            .slice(0, 6)
            .map((activity) => (
              <div
                className="activity"
                key={activity._id}
              >
                <span className="activity-dot" />

                <div>
                  <p>
                    {activity.text}
                  </p>

                  <small>
                    {new Date(
                      activity.createdAt
                    ).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </small>
                </div>
              </div>
            ))}

          {!data.activities.length && (
            <Empty text="Activity will appear here." />
          )}
        </section>
      </div>
    </div>
  );
}

/* =========================
   BOARD
========================= */

function Board({
  data,
  moveTask,
  onTask
}) {
  const columns = [
    {
      id: "todo",
      name: "To do",
      hint: "Ideas & planned"
    },
    {
      id: "progress",
      name: "In progress",
      hint: "Currently working"
    },
    {
      id: "done",
      name: "Done",
      hint: "Shipped work"
    }
  ];

  return (
    <div className="content">
      <div className="board-toolbar">
        <p className="muted">
          Organize your team's work.
        </p>

        <button
          className="primary"
          onClick={onTask}
        >
          + New task
        </button>
      </div>

      <div className="board">
        {columns.map((column) => {
          const tasks =
            data.tasks.filter(
              (task) =>
                task.status ===
                column.id
            );

          return (
            <section
              className="column"
              key={column.id}
            >
              <div className="column-head">
                <div>
                  <h3>
                    {column.name}
                  </h3>

                  <small>
                    {column.hint}
                  </small>
                </div>

                <span>
                  {tasks.length}
                </span>
              </div>

              {tasks.map((task) => (
                <article
                  className="task-card"
                  key={task._id}
                >
                  <div className="card-top">
                    <span
                      className={`priority ${task.priority}`}
                    >
                      {task.priority}
                    </span>

                    <span>
                      ⋮
                    </span>
                  </div>

                  <h4>
                    {task.title}
                  </h4>

                  <p>
                    {task.description ||
                      "No description"}
                  </p>

                  {task.project && (
                    <div className="project-chip">
                      <i
                        style={{
                          background:
                            task.project
                              .color
                        }}
                      />

                      {task.project.name}
                    </div>
                  )}

                  <div className="card-foot">
                    <span className="assignee-mini">
                      {task.assignee
                        ?.name?.[0] ||
                        "?"}
                    </span>

                    <select
                      value={task.status}
                      onChange={(e) =>
                        moveTask(
                          task,
                          e.target.value
                        )
                      }
                    >
                      <option value="todo">
                        To do
                      </option>

                      <option value="progress">
                        In progress
                      </option>

                      <option value="done">
                        Done
                      </option>
                    </select>
                  </div>
                </article>
              ))}

              {!tasks.length && (
                <div className="drop-zone">
                  No tasks
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   PROJECTS
========================= */

function Projects({
  data,
  onProject
}) {
  return (
    <div className="content">
      <div className="page-actions">
        <p className="muted">
          {data.projects.length} active
          projects
        </p>

        <button
          className="primary"
          onClick={onProject}
        >
          + New project
        </button>
      </div>

      <div className="project-grid">
        {data.projects.map(
          (project) => {
            const tasks =
              data.tasks.filter(
                (task) =>
                  task.project?._id ===
                  project._id
              );

            const completed =
              tasks.filter(
                (task) =>
                  task.status ===
                  "done"
              ).length;

            const percentage =
              tasks.length
                ? Math.round(
                    (completed /
                      tasks.length) *
                      100
                  )
                : 0;

            return (
              <article
                className="project-card"
                key={project._id}
              >
                <div
                  className="project-cover"
                  style={{
                    background: `linear-gradient(135deg, ${project.color}, #18181b)`
                  }}
                >
                  <span>
                    {project.name[0]}
                  </span>
                </div>

                <div className="project-body">
                  <div className="project-title">
                    <h3>
                      {project.name}
                    </h3>

                    <span>
                      •••
                    </span>
                  </div>

                  <p>
                    {project.description ||
                      "No description"}
                  </p>

                  <div className="bar">
                    <i
                      style={{
                        width: `${percentage}%`,
                        background:
                          project.color
                      }}
                    />
                  </div>

                  <div className="project-meta">
                    <span>
                      {completed}/
                      {tasks.length} tasks
                    </span>

                    <span>
                      {project.dueDate ||
                        "No deadline"}
                    </span>
                  </div>
                </div>
              </article>
            );
          }
        )}

        {!data.projects.length && (
          <Empty text="No projects yet. Create one to organize your work." />
        )}
      </div>
    </div>
  );
}

/* =========================
   TEAM
========================= */

function Team({
  data,
  refresh,
  flash
}) {
  const [email, setEmail] =
    useState("");

  const members =
    Array.isArray(data?.members)
      ? data.members
      : [];

  async function addMember(e) {
    e.preventDefault();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) return;

    try {
      await API(
        "/workspace/members",
        {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail
          })
        }
      );

      setEmail("");

      await refresh();

      flash(
        "Member added successfully"
      );
    } catch (error) {
      flash(error.message);
    }
  }

  return (
    <div className="content">
      <div className="page-actions">
        <div>
          <p className="eyebrow">
            PEOPLE
          </p>

          <h2>
            Your team
          </h2>

          <p className="muted">
            {members.length}{" "}
            {members.length === 1
              ? "member"
              : "members"}{" "}
            in this workspace
          </p>
        </div>
      </div>

      <section className="panel team-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              ADD PEOPLE
            </p>

            <h3>
              Invite a teammate
            </h3>
          </div>
        </div>

        <form
          className="invite"
          onSubmit={addMember}
        >
          <input
            type="email"
            placeholder="Enter registered email..."
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <button
            className="primary"
            type="submit"
          >
            + Add member
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              MEMBERS
            </p>

            <h3>
              {members.length}{" "}
              {members.length === 1
                ? "person"
                : "people"}
            </h3>
          </div>
        </div>

        {members.length > 0 ? (
          <div className="member-list">
            {members.map(
              (member, index) => {
                const name =
                  member?.name ||
                  "Unknown user";

                const email =
                  member?.email ||
                  "No email";

                return (
                  <div
                    className="member"
                    key={
                      member?._id ||
                      `${email}-${index}`
                    }
                  >
                    <span className="big-avatar">
                      {name[0].toUpperCase()}
                    </span>

                    <div className="member-info">
                      <b>
                        {name}
                      </b>

                      <small>
                        {email}
                      </small>
                    </div>

                    <span className="online">
                      {index === 0
                        ? "Owner"
                        : "Member"}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="empty">
            <div
              style={{
                fontSize: "48px",
                marginBottom: "12px"
              }}
            >
              👥
            </div>

            <h3>
              No teammates yet
            </h3>

            <p>
              Add a teammate using
              their registered email
              address.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================
   APP
========================= */

export default function App() {
  const [user, setUser] =
    useState(null);

  const [workspace, setWorkspace] =
    useState(null);

  const [data, setData] =
    useState({
      projects: [],
      tasks: [],
      activities: [],
      members: []
    });

  const [view, setView] =
    useState("overview");

  const [modal, setModal] =
    useState(null);

  const [notice, setNotice] =
    useState("");

  const [task, setTask] =
    useState({
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      project: "",
      assignee: "",
      dueDate: ""
    });

  const [project, setProject] =
    useState({
      name: "",
      description: "",
      color: "#7c3aed",
      dueDate: ""
    });

  /* =========================
     CHECK LOGIN
  ========================= */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "flowspace_token"
      );

    if (!token) return;

    API("/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(
          "flowspace_token"
        );

        setUser(null);
      });
  }, []);

  /* =========================
     LOAD DATA
  ========================= */

  async function refresh() {
    if (!user) return;

    try {
      const [
        workspaceData,
        dataData
      ] = await Promise.all([
        API("/workspace"),
        API("/data")
      ]);

      setWorkspace(
        workspaceData
      );

      setData({
        projects:
          Array.isArray(
            dataData?.projects
          )
            ? dataData.projects
            : [],

        tasks:
          Array.isArray(
            dataData?.tasks
          )
            ? dataData.tasks
            : [],

        activities:
          Array.isArray(
            dataData?.activities
          )
            ? dataData.activities
            : [],

        members:
          Array.isArray(
            dataData?.members
          )
            ? dataData.members
            : []
      });
    } catch (error) {
      flash(error.message);
    }
  }

  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user]);

  /* =========================
     NOTIFICATION
  ========================= */

  function flash(message) {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 3000);
  }

  /* =========================
     CREATE PROJECT
  ========================= */

  async function createProject(e) {
    e.preventDefault();

    try {
      await API("/projects", {
        method: "POST",
        body: JSON.stringify(
          project
        )
      });

      setProject({
        name: "",
        description: "",
        color: "#7c3aed",
        dueDate: ""
      });

      setModal(null);

      await refresh();

      flash(
        "Project created successfully"
      );
    } catch (error) {
      flash(error.message);
    }
  }

  /* =========================
     CREATE TASK
  ========================= */

  async function createTask(e) {
    e.preventDefault();

    try {
      await API("/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...task,
          project:
            task.project || undefined,
          assignee:
            task.assignee || undefined
        })
      });

      setTask({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        project: "",
        assignee: "",
        dueDate: ""
      });

      setModal(null);

      await refresh();

      flash(
        "Task created successfully"
      );
    } catch (error) {
      flash(error.message);
    }
  }

  /* =========================
     MOVE TASK
  ========================= */

  async function moveTask(
    task,
    status
  ) {
    try {
      await API(
        `/tasks/${task._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status
          })
        }
      );

      await refresh();
    } catch (error) {
      flash(error.message);
    }
  }

  /* =========================
     DEMO DATA
  ========================= */

  async function seed() {
    try {
      const result =
        await API("/seed", {
          method: "POST"
        });

      await refresh();

      flash(
        result.message ||
          "Demo data loaded"
      );
    } catch (error) {
      flash(error.message);
    }
  }

  /* =========================
     LOGOUT
  ========================= */

  function logout() {
    localStorage.removeItem(
      "flowspace_token"
    );

    setUser(null);
    setWorkspace(null);

    setData({
      projects: [],
      tasks: [],
      activities: [],
      members: []
    });

    setView("overview");
  }

  /* =========================
     AUTH SCREEN
  ========================= */

  if (!user) {
    return (
      <Auth
        onLogin={setUser}
      />
    );
  }

  const completedTasks =
    data.tasks.filter(
      (task) =>
        task.status === "done"
    ).length;

  const progress =
    data.tasks.length
      ? Math.round(
          (completedTasks /
            data.tasks.length) *
            100
        )
      : 0;

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="app">
      <aside className="sidebar">
        <Logo />

        <div className="workspace-switch">
          <div className="workspace-avatar">
            {(workspace?.name ||
              "M")[0]}
          </div>

          <div>
            <strong>
              {workspace?.name ||
                "My Team"}
            </strong>

            <small>
              Workspace
            </small>
          </div>

          <span>⌄</span>
        </div>

        <nav>
          <button
            className={
              view === "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("overview")
            }
          >
            ⌂
            <span>
              Overview
            </span>
          </button>

          <button
            className={
              view === "board"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("board")
            }
          >
            ▦
            <span>
              Task board
            </span>
          </button>

          <button
            className={
              view === "projects"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("projects")
            }
          >
            ◈
            <span>
              Projects
            </span>
          </button>

          <button
            className={
              view === "team"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("team")
            }
          >
            ◎
            <span>
              Team
            </span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button onClick={seed}>
            ✦
            <span>
              Load demo data
            </span>
          </button>

          <button onClick={logout}>
            ↪
            <span>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              WORKSPACE /{" "}
              {view.toUpperCase()}
            </p>

            <h1>
              {view === "overview"
                ? `Good morning, ${
                    user.name.split(
                      " "
                    )[0]
                  } 👋`
                : view === "board"
                ? "Task board"
                : view === "projects"
                ? "Projects"
                : "Your team"}
            </h1>
          </div>

          <div className="top-actions">
            <div className="avatar">
              {user.name[0].toUpperCase()}
            </div>

            <div className="user-name">
              <b>
                {user.name}
              </b>

              <small>
                {user.email}
              </small>
            </div>
          </div>
        </header>

        {notice && (
          <div className="toast">
            {notice}
          </div>
        )}

        {view === "overview" && (
          <Overview
            data={data}
            done={completedTasks}
            progress={progress}
            onTask={() =>
              setModal("task")
            }
            onProject={() =>
              setModal("project")
            }
            onBoard={() =>
              setView("board")
            }
          />
        )}

        {view === "board" && (
          <Board
            data={data}
            moveTask={moveTask}
            onTask={() =>
              setModal("task")
            }
          />
        )}

        {view === "projects" && (
          <Projects
            data={data}
            onProject={() =>
              setModal("project")
            }
          />
        )}

        {view === "team" && (
          <Team
            data={data}
            refresh={refresh}
            flash={flash}
          />
        )}

        {/* PROJECT MODAL */}

        {modal === "project" && (
          <Modal
            title="Create project"
            onClose={() =>
              setModal(null)
            }
          >
            <form
              className="form"
              onSubmit={
                createProject
              }
            >
              <label>
                Project name

                <input
                  value={
                    project.name
                  }
                  onChange={(e) =>
                    setProject({
                      ...project,
                      name:
                        e.target.value
                    })
                  }
                  placeholder="e.g. Product launch"
                  required
                />
              </label>

              <label>
                Description

                <textarea
                  value={
                    project.description
                  }
                  onChange={(e) =>
                    setProject({
                      ...project,
                      description:
                        e.target.value
                    })
                  }
                />
              </label>

              <div className="grid2">
                <label>
                  Color

                  <input
                    type="color"
                    value={
                      project.color
                    }
                    onChange={(e) =>
                      setProject({
                        ...project,
                        color:
                          e.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Due date

                  <input
                    type="date"
                    value={
                      project.dueDate
                    }
                    onChange={(e) =>
                      setProject({
                        ...project,
                        dueDate:
                          e.target.value
                      })
                    }
                  />
                </label>
              </div>

              <button className="primary wide">
                Create project
              </button>
            </form>
          </Modal>
        )}

        {/* TASK MODAL */}

        {modal === "task" && (
          <Modal
            title="Create task"
            onClose={() =>
              setModal(null)
            }
          >
            <form
              className="form"
              onSubmit={
                createTask
              }
            >
              <label>
                Task title

                <input
                  value={
                    task.title
                  }
                  onChange={(e) =>
                    setTask({
                      ...task,
                      title:
                        e.target.value
                    })
                  }
                  placeholder="What needs to be done?"
                  required
                />
              </label>

              <label>
                Description

                <textarea
                  value={
                    task.description
                  }
                  onChange={(e) =>
                    setTask({
                      ...task,
                      description:
                        e.target.value
                    })
                  }
                />
              </label>

              <div className="grid2">
                <label>
                  Project

                  <select
                    value={
                      task.project
                    }
                    onChange={(e) =>
                      setTask({
                        ...task,
                        project:
                          e.target.value
                      })
                    }
                  >
                    <option value="">
                      No project
                    </option>

                    {data.projects.map(
                      (project) => (
                        <option
                          key={
                            project._id
                          }
                          value={
                            project._id
                          }
                        >
                          {
                            project.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Priority

                  <select
                    value={
                      task.priority
                    }
                    onChange={(e) =>
                      setTask({
                        ...task,
                        priority:
                          e.target.value
                      })
                    }
                  >
                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>
                  </select>
                </label>
              </div>

              <div className="grid2">
                <label>
                  Assignee

                  <select
                    value={
                      task.assignee
                    }
                    onChange={(e) =>
                      setTask({
                        ...task,
                        assignee:
                          e.target.value
                      })
                    }
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {data.members.map(
                      (member) => (
                        <option
                          key={
                            member._id
                          }
                          value={
                            member._id
                          }
                        >
                          {
                            member.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Due date

                  <input
                    type="date"
                    value={
                      task.dueDate
                    }
                    onChange={(e) =>
                      setTask({
                        ...task,
                        dueDate:
                          e.target.value
                      })
                    }
                  />
                </label>
              </div>

              <button className="primary wide">
                Create task
              </button>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}