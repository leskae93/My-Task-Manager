import { useState, useEffect, useRef } from "react";

const TAG_COLORS = [
  "#6a8fff", "#4ec9e8", "#3a7bd5", "#7ab8f5",
  "#2196c4", "#89c4ff", "#1a5fa8", "#5bc8d4"
];

const PRIORITIES = [
  { id: "urgent-important", label: "Urgent & Important", color: "#ff4d4d" },
  { id: "important",        label: "Important",          color: "#ff9500" },
  { id: "urgent",           label: "Urgent",             color: "#f7e24a" },
  { id: "backburner",       label: "Back Burner",        color: "#888"    },
];

const DIFFICULTIES = [
  { id: "easy",   label: "Easy",   color: "#c5f0a4" },
  { id: "medium", label: "Medium", color: "#a8d94a" },
  { id: "hard",   label: "Hard",   color: "#4ecb8a" },
];

const FOCUS_LEVELS = [
  { id: "light",  label: "Light Focus", color: "#d4aaff" },
  { id: "medium", label: "Medium Focus", color: "#a855f7" },
  { id: "deep",   label: "Deep Focus",  color: "#6b21a8" },
];

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: "#ff6b6b" };
  if (diff === 0) return { label: "Due today", color: "#f7a74a" };
  if (diff === 1) return { label: "Due tomorrow", color: "#f7e24a" };
  return { label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, color: "#888" };
}

function HoldTapSpan({ onTap, onHold, style, children }) {
  const timer = useRef(null);
  const didHold = useRef(false);

  function start() {
    didHold.current = false;
    timer.current = setTimeout(() => {
      didHold.current = true;
      onHold();
    }, 500);
  }

  function cancel() { clearTimeout(timer.current); }

  function end(e) {
    e.preventDefault();
    clearTimeout(timer.current);
    if (!didHold.current) onTap();
  }

  return (
    <span
      onMouseDown={start} onMouseUp={end} onMouseLeave={cancel}
      onTouchStart={start} onTouchEnd={end} onTouchCancel={cancel}
      style={{ ...style, userSelect: "none", WebkitUserSelect: "none" }}
    >{children}</span>
  );
}

function PopupMenu({ options, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    let touchMoved = false;
    function onTouchStart() { touchMoved = false; }
    function onTouchMove() { touchMoved = true; }
    function onTouchEnd(e) { if (!touchMoved && ref.current && !ref.current.contains(e.target)) onClose(); }
    function onMouseDown(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "absolute", zIndex: 100, top: "calc(100% + 4px)", left: 0,
      background: "#1e1e30", border: "1px solid #3a3a55", borderRadius: 10,
      padding: "6px", minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
    }}>
      {options.map(opt => (
        <div key={opt.value} onClick={() => { onSelect(opt.value); onClose(); }}
          style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            color: opt.color || "#f0f0f0", userSelect: "none", WebkitUserSelect: "none" }}
          onMouseOver={e => e.currentTarget.style.background = "#2a2a3e"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >{opt.label}</div>
      ))}
    </div>
  );
}

function DatePicker({ value, onChange, onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value ? parseInt(value.split("-")[0]) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? parseInt(value.split("-")[1]) - 1 : today.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    let touchMoved = false;
    function handleTouchStart() { touchMoved = false; }
    function handleTouchMove() { touchMoved = true; }
    function handleTouchEnd(e) { if (!touchMoved && ref.current && !ref.current.contains(e.target)) onClose(); }
    function handleMouseDown(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onClose]);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDay(y, m) { return new Date(y, m, 1).getDay(); }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDay(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  function selectDay(d) {
    const str = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    onChange(str);
    onClose();
  }

  return (
    <div ref={ref} style={{
      position: "absolute", zIndex: 100, top: "calc(100% + 6px)", left: 0,
      background: "#1e1e30", border: "1px solid #3a3a55", borderRadius: 10,
      padding: "12px", width: 240, boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>‹</button>
        <span style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 600 }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#555", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const str = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isSelected = str === value;
          const isToday = str === todayStr;
          return (
            <div key={i} onClick={() => selectDay(d)} style={{
              textAlign: "center", fontSize: 12, padding: "5px 2px", borderRadius: 6, cursor: "pointer",
              background: isSelected ? "#6a8fff" : "transparent",
              color: isSelected ? "#fff" : isToday ? "#6a8fff" : "#d0d0e0",
              fontWeight: isToday ? 700 : 400,
              border: isToday && !isSelected ? "1px solid #6a8fff44" : "1px solid transparent",
            }}>{d}</div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => { onChange(""); onClose(); }}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 12 }}>Clear</button>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: "#6a8fff", cursor: "pointer", fontSize: 12 }}>Done</button>
      </div>
    </div>
  );
}

function TaskItem({ todo, tags, toggleTodo, deleteTodo, updateTodo }) {
  const due = formatDueDate(todo.dueDate);
  const subtasks = todo.subtasks || [];
  const [expanded, setExpanded] = useState(true);
  const [subInput, setSubInput] = useState("");
  const [showSubInput, setShowSubInput] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [editingTag, setEditingTag] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingDifficulty, setEditingDifficulty] = useState(false);
  const [editingFocus, setEditingFocus] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftText, setDraftText] = useState(todo.text);
  const [editingSubId, setEditingSubId] = useState(null);
  const [editingSubText, setEditingSubText] = useState("");

  const priority = PRIORITIES.find(p => p.id === todo.priority);
  const difficulty = DIFFICULTIES.find(d => d.id === todo.difficulty);
  const focusLevel = FOCUS_LEVELS.find(f => f.id === todo.focus);
  const doneCount = subtasks.filter(s => s.done).length;

  function saveText() {
    if (draftText.trim()) updateTodo(todo.id, { text: draftText.trim() });
    setEditingText(false);
  }

  function addSubtask(keepOpen = false) {
    if (!subInput.trim()) return;
    updateTodo(todo.id, { subtasks: [...subtasks, { id: Date.now(), text: subInput.trim(), done: false }] });
    setSubInput("");
    if (!keepOpen) setShowSubInput(false);
  }

  function toggleSubtask(subId) {
    updateTodo(todo.id, { subtasks: subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s) });
  }

  function deleteSubtask(subId) {
    updateTodo(todo.id, { subtasks: subtasks.filter(s => s.id !== subId) });
  }

  const checkboxSize = 18;
  const indent = checkboxSize + 10;

  return (
    <li style={{ padding: "11px 0", borderBottom: "1px solid #2e2e42" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => toggleTodo(todo.id)}
          style={{ width: checkboxSize, height: checkboxSize, borderRadius: 4, border: "1px solid #666",
            background: todo.done ? "#666" : "transparent", cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          {todo.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>}
        </div>

        {editingText ? (
          <input autoFocus className="edit-input" value={draftText}
            onChange={e => setDraftText(e.target.value)}
            onBlur={saveText}
            onKeyDown={e => { if (e.key === "Enter") saveText(); if (e.key === "Escape") { setDraftText(todo.text); setEditingText(false); } }}
          />
        ) : (
          <span onClick={() => { setDraftText(todo.text); setEditingText(true); }}
            style={{ flex: 1, fontSize: 15, cursor: "text",
              color: todo.done ? "#555" : "#f0f0f0",
              textDecoration: todo.done ? "line-through" : "none" }}>
            {todo.text}
          </span>
        )}
        <button className="icon-btn delete-icon" onClick={() => deleteTodo(todo.id)} title="Delete">×</button>
      </div>

      {!todo.done && (
        <div style={{ marginLeft: indent, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>

          {/* Due date */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, position: "relative" }}>
            <span onClick={() => setShowDatePicker(v => !v)}
              style={{ fontSize: 11, color: due ? due.color : "#888", cursor: "pointer", whiteSpace: "nowrap" }}>
              {due ? due.label : "+ due date"}
            </span>
            {showDatePicker && (
              <DatePicker
                value={todo.dueDate || ""}
                onChange={val => updateTodo(todo.id, { dueDate: val })}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </span>

          {/* Priority */}
          <span style={{ position: "relative", display: "inline-flex" }}>
            {priority ? (
              <HoldTapSpan onTap={() => updateTodo(todo.id, { priority: "" })} onHold={() => setEditingPriority(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  background: "transparent", color: priority.color, border: "none", whiteSpace: "nowrap" }}>{priority.label}</HoldTapSpan>
            ) : (
              <span onClick={() => setEditingPriority(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  color: "#888", border: "none", whiteSpace: "nowrap" }}>+ priority</span>
            )}
            {editingPriority && (
              <PopupMenu
                options={[{ value: "", label: "None", color: "#888" }, ...PRIORITIES.map(p => ({ value: p.id, label: p.label, color: p.color }))]}
                onSelect={val => updateTodo(todo.id, { priority: val })}
                onClose={() => setEditingPriority(false)}
              />
            )}
          </span>

          {/* Tag */}
          <span style={{ position: "relative", display: "inline-flex" }}>
            {todo.tag && tags[todo.tag] ? (
              <HoldTapSpan onTap={() => updateTodo(todo.id, { tag: "" })} onHold={() => setEditingTag(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  background: "transparent", color: tags[todo.tag], border: "none", whiteSpace: "nowrap" }}>{todo.tag}</HoldTapSpan>
            ) : (
              <span onClick={() => setEditingTag(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  color: "#888", border: "none", whiteSpace: "nowrap" }}>+ tag</span>
            )}
            {editingTag && (
              <PopupMenu
                options={[{ value: "", label: "No tag", color: "#888" }, ...Object.entries(tags).sort(([a],[b]) => a.localeCompare(b)).map(([name, color]) => ({ value: name, label: name, color }))]}
                onSelect={val => updateTodo(todo.id, { tag: val })}
                onClose={() => setEditingTag(false)}
              />
            )}
          </span>

          {/* Difficulty */}
          <span style={{ position: "relative", display: "inline-flex" }}>
            {difficulty ? (
              <HoldTapSpan onTap={() => updateTodo(todo.id, { difficulty: "" })} onHold={() => setEditingDifficulty(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  background: "transparent", color: difficulty.color, border: "none", whiteSpace: "nowrap" }}>{difficulty.label}</HoldTapSpan>
            ) : (
              <span onClick={() => setEditingDifficulty(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  color: "#888", border: "none", whiteSpace: "nowrap" }}>+ difficulty</span>
            )}
            {editingDifficulty && (
              <PopupMenu
                options={[{ value: "", label: "None", color: "#888" }, ...DIFFICULTIES.map(d => ({ value: d.id, label: d.label, color: d.color }))]}
                onSelect={val => updateTodo(todo.id, { difficulty: val })}
                onClose={() => setEditingDifficulty(false)}
              />
            )}
          </span>

          {/* Focus */}
          <span style={{ position: "relative", display: "inline-flex" }}>
            {focusLevel ? (
              <HoldTapSpan onTap={() => updateTodo(todo.id, { focus: "" })} onHold={() => setEditingFocus(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  background: "transparent", color: focusLevel.color, border: "none", whiteSpace: "nowrap" }}>{focusLevel.label}</HoldTapSpan>
            ) : (
              <span onClick={() => setEditingFocus(true)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  color: "#888", border: "none", whiteSpace: "nowrap" }}>+ focus</span>
            )}
            {editingFocus && (
              <PopupMenu
                options={[{ value: "", label: "None", color: "#888" }, ...FOCUS_LEVELS.map(f => ({ value: f.id, label: f.label, color: f.color }))]}
                onSelect={val => updateTodo(todo.id, { focus: val })}
                onClose={() => setEditingFocus(false)}
              />
            )}
          </span>

        </div>
      )}

      {/* Subtasks */}
      <div style={{ marginLeft: indent, marginTop: 5 }}>
        {subtasks.length > 0 && (
          <span onClick={() => setExpanded(v => !v)}
            style={{ fontSize: 11, color: doneCount === subtasks.length ? "#4ecb71" : "#888", cursor: "pointer", display: "block", marginBottom: 4 }}>
            {expanded ? "▾" : "▸"} {doneCount}/{subtasks.length} subtasks
          </span>
        )}
        {expanded && (
          <>
            {subtasks.map(sub => (
              <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #232336" }}>
                <div onClick={() => toggleSubtask(sub.id)}
                  style={{ width: 16, height: 16, borderRadius: 3, border: "1px solid #555",
                    background: sub.done ? "#555" : "transparent", cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {sub.done && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>}
                </div>
                {editingSubId === sub.id ? (
                  <input autoFocus value={editingSubText}
                    onChange={e => setEditingSubText(e.target.value)}
                    onBlur={() => { if (editingSubText.trim()) updateTodo(todo.id, { subtasks: subtasks.map(s => s.id === sub.id ? { ...s, text: editingSubText.trim() } : s) }); setEditingSubId(null); }}
                    onKeyDown={e => { if (e.key === "Enter") { if (editingSubText.trim()) updateTodo(todo.id, { subtasks: subtasks.map(s => s.id === sub.id ? { ...s, text: editingSubText.trim() } : s) }); setEditingSubId(null); } if (e.key === "Escape") setEditingSubId(null); }}
                    style={{ flex: 1, fontSize: 13, background: "#1e1e30", border: "1px solid #6a8fff", borderRadius: 6, color: "#f0f0f0", outline: "none", padding: "2px 6px" }}
                  />
                ) : (
                  <span onClick={() => { setEditingSubId(sub.id); setEditingSubText(sub.text); }}
                    style={{ flex: 1, fontSize: 13, cursor: "text", color: sub.done ? "#555" : "#c0c0d0", textDecoration: sub.done ? "line-through" : "none" }}>
                    {sub.text}
                  </span>
                )}
                <button onClick={() => deleteSubtask(sub.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1 }}
                  onMouseOver={e => e.target.style.color = "#ff6b6b"} onMouseOut={e => e.target.style.color = "#666"}>×</button>
              </div>
            ))}
            {showSubInput ? (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input autoFocus value={subInput} onChange={e => setSubInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addSubtask(true); if (e.key === "Escape") setShowSubInput(false); }}
                  onBlur={() => { setShowSubInput(false); setSubInput(""); }}
                  placeholder="Add subtask..."
                  style={{ flex: 1, padding: "5px 9px", fontSize: 13, background: "#1e1e30", border: "1px solid #6a8fff", borderRadius: 6, color: "#f0f0f0", outline: "none" }} />
              </div>
            ) : (
              <button onClick={() => setShowSubInput(true)}
                style={{ marginTop: 5, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 12, padding: "2px 0" }}
                onMouseOver={e => e.target.style.color = "#bbb"} onMouseOut={e => e.target.style.color = "#888"}>
                + Add subtask
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export default function TodoList() {
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem("todos");
      return saved ? JSON.parse(saved) : [
        { id: 1, text: "Buy groceries", done: false, tag: "Personal", dueDate: "", subtasks: [], priority: "", focus: "" },
        { id: 2, text: "Walk the dog", done: false, tag: "Personal", dueDate: "", subtasks: [], priority: "", focus: "" },
        { id: 3, text: "Read a book", done: true, tag: "", dueDate: "", subtasks: [], priority: "", focus: "" },
      ];
    } catch { return []; }
  });
  const [tags, setTags] = useState(() => {
    try {
      const saved = localStorage.getItem("tags");
      return saved ? JSON.parse(saved) : { "Personal": "#4ecb71", "Work": "#6a8fff" };
    } catch { return {}; }
  });
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filterTag, setFilterTag] = useState("All");
  const [newTagName, setNewTagName] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [confirmDeleteTag, setConfirmDeleteTag] = useState(null);
  const [showDone, setShowDone] = useState(true);
  const [view, setView] = useState(() => {
    try { return localStorage.getItem("view") || "list"; } catch { return "list"; }
  });
  const [sortLevels, setSortLevels] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sortLevels")) || []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("todos", JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem("tags", JSON.stringify(tags)); }, [tags]);
  useEffect(() => { localStorage.setItem("sortLevels", JSON.stringify(sortLevels)); }, [sortLevels]);
  useEffect(() => { localStorage.setItem("view", view); }, [view]);

  function addTodo() {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), done: false, tag: selectedTag, dueDate, subtasks: [], priority: selectedPriority, difficulty: selectedDifficulty, focus: "" }]);
    setInput("");
    setDueDate("");
    setSelectedPriority("");
    setSelectedDifficulty("");
    setSelectedTag("");
  }

  function toggleTodo(id) { setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTodo(id) { setTodos(todos.filter(t => t.id !== id)); }
  function updateTodo(id, changes) { setTodos(todos.map(t => t.id === id ? { ...t, ...changes } : t)); }

  function addTag() {
    const name = newTagName.trim();
    if (!name || tags[name]) return;
    const usedColors = Object.values(tags);
    const color = TAG_COLORS.find(c => !usedColors.includes(c)) || TAG_COLORS[0];
    setTags({ ...tags, [name]: color });
    setNewTagName("");
    setShowTagInput(false);
  }

  function deleteTag(name) {
    const updated = { ...tags };
    delete updated[name];
    setTags(updated);
    setTodos(todos.map(t => t.tag === name ? { ...t, tag: "" } : t));
    if (filterTag === name) setFilterTag("All");
    if (selectedTag === name) setSelectedTag("");
  }

  const PRIORITY_ORDER = ["urgent-important", "important", "urgent", "backburner", ""];

  function compareBy(key, dir, a, b) {
    let result = 0;
    if (key === "priority") {
      const ai = PRIORITY_ORDER.indexOf(a.priority || "");
      const bi = PRIORITY_ORDER.indexOf(b.priority || "");
      result = (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    } else if (key === "dueDate") {
      if (!a.dueDate && !b.dueDate) result = 0;
      else if (!a.dueDate) result = 1;
      else if (!b.dueDate) result = -1;
      else result = a.dueDate.localeCompare(b.dueDate);
    } else if (key === "newest") {
      result = b.id - a.id;
    }
    return dir === "desc" ? -result : result;
  }

  function sortTasks(tasks) {
    if (!sortLevels.length) return [...tasks].sort((a, b) => b.id - a.id);
    return [...tasks].sort((a, b) => {
      for (const level of sortLevels) {
        const r = compareBy(level.field, level.dir, a, b);
        if (r !== 0) return r;
      }
      return 0;
    });
  }

  const allFiltered = filterTag === "All" ? todos : todos.filter(t => t.tag === filterTag);
  const activeTasks = sortTasks(allFiltered.filter(t => !t.done));
  const doneTasks = allFiltered.filter(t => t.done);

  const allActiveTasks = sortTasks(todos.filter(t => !t.done));
  const kanbanColumns = [
    ...Object.keys(tags).sort((a, b) => a.localeCompare(b)).map(tag => ({
      name: tag, color: tags[tag],
      tasks: allActiveTasks.filter(t => t.tag === tag),
    })),
    { name: "Untagged", color: "#555", tasks: allActiveTasks.filter(t => !t.tag || !tags[t.tag]) }
  ];

  const sharedProps = { tags, toggleTodo, deleteTodo, updateTodo };

  return (
    <div style={{ maxWidth: "100%", margin: "0", padding: "32px 32px", fontFamily: "'Segoe UI', sans-serif", color: "#f0f0f0" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { background: #1a1a2e; margin: 0; }
        input, button, select { font-family: inherit; }
        .task-input { flex: 1; padding: 8px 2px; font-size: 15px; background: transparent; border: none; border-bottom: 1px solid #444; color: #f0f0f0; outline: none; }
        .task-input::placeholder { color: #888; }
        .task-input:focus { border-bottom-color: #6a8fff; }
        .add-btn { padding: 11px 20px; background: #6a8fff; color: #fff; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }
        .add-btn:hover { background: #5577ee; }
        .edit-input { flex: 1; padding: 6px 10px; font-size: 15px; background: #2a2a3e; border: 1px solid #6a8fff; border-radius: 6px; color: #f0f0f0; outline: none; }
        .save-btn { padding: 5px 12px; background: #6a8fff; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
        .icon-btn { background: none; border: none; cursor: pointer; font-size: 17px; padding: 2px 6px; border-radius: 4px; line-height: 1; }
        .delete-icon { color: #aaa; }
        .delete-icon:hover { color: #ff6b6b; }
        .filter-btn { padding: 5px 12px; border-radius: 20px; border: none; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .new-tag-input { padding: 6px 10px; font-size: 13px; background: #2a2a3e; border: 1px solid #6a8fff; border-radius: 6px; color: #f0f0f0; outline: none; width: 130px; }
        .done-toggle { background: none; border: none; cursor: pointer; color: #555; font-size: 12px; display: flex; align-items: center; gap: 6px; padding: 0; }
        .done-toggle:hover { color: #888; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, color: "#f0f0f0", margin: 0 }}>My To-Do List</h1>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setView("list")}
            style={{ background: view === "list" ? "#2a2a3e" : "transparent", border: "none", color: view === "list" ? "#f0f0f0" : "#555", cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
            ☰ List
          </button>
          <button onClick={() => setView("kanban")}
            style={{ background: view === "kanban" ? "#2a2a3e" : "transparent", border: "none", color: view === "kanban" ? "#f0f0f0" : "#555", cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
            ⊞ Board
          </button>
        </div>
      </div>

      {/* Tags row */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>Projects</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <button className="filter-btn" onClick={() => setFilterTag("All")}
            style={{ background: "transparent", color: filterTag === "All" ? "#f0f0f0" : "#888" }}>All</button>
          {Object.entries(tags).sort(([a],[b]) => a.localeCompare(b)).map(([name, color]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button className="filter-btn" onClick={() => setFilterTag(filterTag === name ? "All" : name)}
                style={{ background: "transparent", color: filterTag === name ? color : "#aaa" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 5 }} />
                {name}
              </button>
              <button onClick={() => setConfirmDeleteTag(name)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13, padding: "0", marginLeft: -8, lineHeight: 1 }}>×</button>
            </div>
          ))}
          {showTagInput ? (
            <>
              <input autoFocus className="new-tag-input" placeholder="Tag name..." value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addTag(); if (e.key === "Escape") setShowTagInput(false); }} />
              <button className="save-btn" onClick={addTag}>Add</button>
              <button className="icon-btn delete-icon" onClick={() => setShowTagInput(false)}>✕</button>
            </>
          ) : (
            <button onClick={() => setShowTagInput(true)} style={{ background: "none", border: "none", color: "#666", fontSize: 12, cursor: "pointer" }}>+ New tag</button>
          )}
        </div>
      </div>

      {/* Add a task */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input className="task-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTodo()} placeholder="Add a new task..." />
      </div>

      {/* Sort controls */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>Sort</div>
        {sortLevels.map((level, i) => {
          const usedFields = sortLevels.map(l => l.field).filter((_, j) => j !== i);
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <select value={level.field}
                onChange={e => setSortLevels(sortLevels.map((l, j) => j === i ? { ...l, field: e.target.value } : l))}
                style={{ flex: 1, fontSize: 13, padding: "6px 8px", background: "#2a2a3e", border: "1px solid #444", borderRadius: 8, color: "#f0f0f0", outline: "none", cursor: "pointer" }}>
                {!usedFields.includes("newest") && <option value="newest">Newest</option>}
                {!usedFields.includes("priority") && <option value="priority">Priority</option>}
                {!usedFields.includes("dueDate") && <option value="dueDate">Due Date</option>}
              </select>
              <select value={level.dir}
                onChange={e => setSortLevels(sortLevels.map((l, j) => j === i ? { ...l, dir: e.target.value } : l))}
                style={{ fontSize: 13, padding: "6px 8px", background: "#2a2a3e", border: "1px solid #444", borderRadius: 8, color: "#f0f0f0", outline: "none", cursor: "pointer" }}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button onClick={() => setSortLevels(sortLevels.filter((_, j) => j !== i))}
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 }}
                onMouseOver={e => e.target.style.color = "#ff6b6b"} onMouseOut={e => e.target.style.color = "#666"}>×</button>
            </div>
          );
        })}
        {sortLevels.length < 3 && (
          <button onClick={() => {
            const usedFields = sortLevels.map(l => l.field);
            const available = ["newest", "priority", "dueDate"].find(f => !usedFields.includes(f));
            if (available) setSortLevels([...sortLevels, { field: available, dir: "asc" }]);
          }}
            style={{ fontSize: 12, color: "#888", background: "none", border: "1px dashed #444", borderRadius: 8, padding: "5px 12px", cursor: "pointer", marginTop: 2 }}>
            + Add sort
          </button>
        )}
      </div>

      {view === "list" ? (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {activeTasks.length === 0 && (
              <li style={{ color: "#888", textAlign: "center", padding: 24 }}>No active tasks!</li>
            )}
            {activeTasks.map(todo => <TaskItem key={todo.id} todo={todo} {...sharedProps} />)}
          </ul>
          <p style={{ marginTop: 12, marginBottom: 32, color: "#888", fontSize: 13 }}>
            {activeTasks.length} task(s) remaining
          </p>
        </>
      ) : (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 24, alignItems: "flex-start" }}>
          {kanbanColumns.map(col => (
            <div key={col.name} style={{ minWidth: 280, flex: "0 0 280px", background: "#16162a", borderRadius: 10, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: col.color, fontWeight: 500 }}>{col.name}</span>
                <span style={{ fontSize: 11, color: "#555", marginLeft: "auto" }}>{col.tasks.length}</span>
              </div>
              {col.tasks.length === 0 && (
                <div style={{ fontSize: 12, color: "#444", textAlign: "center", padding: "20px 0" }}>No tasks</div>
              )}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.tasks.map(todo => <TaskItem key={todo.id} todo={todo} {...sharedProps} />)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {confirmDeleteTag && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setConfirmDeleteTag(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#1e1e30", border: "1px solid #3a3a55", borderRadius: 12,
            padding: "24px 28px", minWidth: 260, textAlign: "center"
          }}>
            <p style={{ fontSize: 15, color: "#f0f0f0", marginBottom: 6 }}>Delete tag?</p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>"{confirmDeleteTag}" will be removed from all tasks.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmDeleteTag(null)}
                style={{ padding: "7px 20px", borderRadius: 8, border: "1px solid #444", background: "transparent", color: "#aaa", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { deleteTag(confirmDeleteTag); setConfirmDeleteTag(null); }}
                style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: "#ff6b6b", color: "#fff", fontSize: 13, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {doneTasks.length > 0 && (
        <div style={{ borderTop: "1px solid #2e2e42", paddingTop: 16 }}>
          <button className="done-toggle" onClick={() => setShowDone(v => !v)}>
            <span style={{ fontSize: 10 }}>{showDone ? "▼" : "▶"}</span>
            <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>Done</span>
            <span style={{ background: "#2a2a3e", color: "#555", borderRadius: 20, padding: "1px 8px", fontSize: 11 }}>{doneTasks.length}</span>
          </button>
          {showDone && (
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0", opacity: 0.9 }}>
              {doneTasks.map(todo => <TaskItem key={todo.id} todo={todo} {...sharedProps} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}