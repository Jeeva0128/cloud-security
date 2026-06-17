/*
  Shared JavaScript for the learning tracker.
  The code is organized into small functions so it is easy to follow and extend.
*/

const STORAGE_KEYS = {
  roadmap: 'cloudTrackerRoadmapProgress',
  logs: 'cloudTrackerStudyLogs',
  skills: 'cloudTrackerSkills',
  projects: 'cloudTrackerProjects',
  notes: 'cloudTrackerNotes'
};

/* ROADMAP_DATA is loaded dynamically from roadmap.json */
let ROADMAP_DATA = [];

const SKILL_LABELS = [
  'Networking',
  'Linux',
  'Security',
  'Cloud',
  'AWS',
  'DevSecOps',
  'Terraform',
  'Detection Engineering'
];

const PROJECT_STATUSES = ['Planned', 'Building', 'Completed'];
const NOTE_CATEGORIES = ['Linux', 'Networking', 'AWS', 'IAM', 'Terraform'];

/* Topic to skill mapping */
const TOPIC_TO_SKILL = {
  'Linux': 'Linux',
  'Linux CLI': 'Linux',
  'Bash': 'Linux',
  'Bash scripting': 'Linux',
  'Shell': 'Linux',
  'Terminal': 'Linux',
  'File permissions': 'Linux',
  'Users and groups': 'Linux',
  'Process management': 'Linux',
  'System administration': 'Linux',
  'Linux security': 'Security',
  'Networking': 'Networking',
  'TCP/IP': 'Networking',
  'DNS': 'Networking',
  'HTTP': 'Networking',
  'Network fundamentals': 'Networking',
  'Network protocols': 'Networking',
  'Network security': 'Security',
  'Firewall': 'Security',
  'Security': 'Security',
  'Encryption': 'Security',
  'Authentication': 'Security',
  'Authorization': 'Security',
  'Cryptography': 'Security',
  'Threat modeling': 'Security',
  'Vulnerability assessment': 'Security',
  'Cloud': 'Cloud',
  'Cloud fundamentals': 'Cloud',
  'Cloud architecture': 'Cloud',
  'Cloud security': 'Security',
  'AWS': 'AWS',
  'EC2': 'AWS',
  'S3': 'AWS',
  'IAM': 'AWS',
  'VPC': 'AWS',
  'Security Groups': 'AWS',
  'EBS': 'AWS',
  'Lambda': 'AWS',
  'CloudWatch': 'AWS',
  'DevOps': 'DevSecOps',
  'DevSecOps': 'DevSecOps',
  'CI/CD': 'DevSecOps',
  'Docker': 'DevSecOps',
  'Kubernetes': 'DevSecOps',
  'Infrastructure as Code': 'DevSecOps',
  'IaC': 'DevSecOps',
  'Terraform': 'Terraform',
  'Infrastructure': 'DevSecOps',
  'Detection Engineering': 'Detection Engineering',
  'Incident Response': 'Security',
  'Forensics': 'Security',
  'Monitoring': 'Security',
  'Logging': 'Security',
  'SIEM': 'Security',
  'Python': 'Linux'
};

function mapTopicToSkill(topic) {
  /* Try exact match first */
  if (TOPIC_TO_SKILL[topic]) {
    return TOPIC_TO_SKILL[topic];
  }
  /* Try partial match (case-insensitive) */
  const lowerTopic = topic.toLowerCase();
  for (const [key, skill] of Object.entries(TOPIC_TO_SKILL)) {
    if (lowerTopic.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTopic)) {
      return skill;
    }
  }
  /* Default to Security if no match */
  return 'Security';
}

function calculateSkillsFromRoadmap() {
  const roadmapItems = getRoadmapItems();
  const progress = getRoadmapProgress();
  const completedItems = roadmapItems.filter(item => Boolean(progress[item.id]));
  
  const skillCounts = {};
  const skillTotals = {};
  
  /* Initialize skill counts */
  SKILL_LABELS.forEach(skill => {
    skillCounts[skill] = 0;
    skillTotals[skill] = 0;
  });
  
  /* Count completed items for each skill */
  roadmapItems.forEach(item => {
    const topics = item.topics || [];
    topics.forEach(topic => {
      const skill = mapTopicToSkill(topic);
      skillTotals[skill]++;
      if (progress[item.id]) {
        skillCounts[skill]++;
      }
    });
  });
  
  /* Calculate percentages */
  const skills = {};
  SKILL_LABELS.forEach(skill => {
    if (skillTotals[skill] > 0) {
      skills[skill] = Math.round((skillCounts[skill] / skillTotals[skill]) * 100);
    } else {
      skills[skill] = 0;
    }
  });
  
  return skills;
}

function getJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getRoadmapItems() {
  const items = [];
  /* Handle new JSON structure: roadmap.months[].weeks[].days[] */
  ROADMAP_DATA.forEach((month, monthIndex) => {
    const monthTitle = month.title || `Month ${month.month}`;
    (month.weeks || []).forEach((week, weekIndex) => {
      const weekLabel = `Week ${week.week}`;
      const weekTheme = week.theme || '';
      (week.days || []).forEach((dayObj, dayIndex) => {
        /* Build a stable id from the day number */
        const id = `m${month.month}w${week.week}d${dayObj.day}`;
        /* Map youtube_search_terms into clickable YouTube search URLs */
        const youtubeUrls = (dayObj.youtube_search_terms || []).map(
          term => `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`
        );
        items.push({
          id,
          day: `Day ${dayObj.day}`,
          dayNumber: dayObj.day,
          topic: dayObj.title || '',
          whatToLearn: (dayObj.learning_objectives || []).join(' • '),
          lab: (dayObj.hands_on_tasks || []).join(' | '),
          youtube: youtubeUrls,
          youtubeSearchTerms: dayObj.youtube_search_terms || [],
          youtubeLinks: dayObj.youtube_links || [],
          documentationLinks: dayObj.documentation_links || [],
          practiceCommands: dayObj.practice_commands || [],
          miniChallenge: dayObj.mini_challenge || '',
          estimatedTime: dayObj.estimated_time_hours || 2,
          difficulty: dayObj.difficulty || 'Beginner',
          githubTask: dayObj.github_task || null,
          revisionTopics: dayObj.revision_topics || [],
          topics: dayObj.topics || [],
          notes: '',
          phase: monthTitle,
          week: weekLabel,
          weekTheme,
          monthIndex,
          weekIndex,
          dayIndex
        });
      });
    });
  });
  return items;
}

function getRoadmapProgress() {
  return getJson(STORAGE_KEYS.roadmap, {});
}

function saveRoadmapProgress(progress) {
  setJson(STORAGE_KEYS.roadmap, progress);
}

function getCompletedCount(items, progress) {
  return items.filter(item => Boolean(progress[item.id])).length;
}

function getCurrentDayIndex(items, progress) {
  const firstIncompleteIndex = items.findIndex(item => !progress[item.id]);
  return firstIncompleteIndex === -1 ? items.length - 1 : firstIncompleteIndex;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function renderNav() {
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === document.body.dataset.page) {
      link.classList.add('active');
    }
  });
}

function createShell(pageTitle, subtitle) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="wrapper">
      <div class="topbar">
        <div class="brand">
          <div class="brand-mark">CS</div>
          <div>
            <h1>${pageTitle}</h1>
            <p>${subtitle}</p>
          </div>
        </div>
        <div class="top-actions">
          <span class="pill">6-month Cloud Security tracker</span>
          <a class="btn btn-ghost" href="dashboard.html">Dashboard</a>
        </div>
      </div>
      <div class="shell">
        <aside class="sidebar">
          <nav class="nav">
            <a data-nav="dashboard" href="dashboard.html">Dashboard</a>
            <a data-nav="roadmap" href="roadmap.html">Roadmap Tracker</a>
            <a data-nav="logs" href="logs.html">Daily Study Log</a>
            <a data-nav="skills" href="skills.html">Skill Tracker</a>
            <a data-nav="projects" href="projects.html">Project Tracker</a>
            <a data-nav="notes" href="notes.html">Notes Page</a>
          </nav>
        </aside>
        <main class="main" id="main"></main>
      </div>
    </div>
  `;
  renderNav();
  return document.getElementById('main');
}

function renderDashboard() {
  const main = createShell('Learning Dashboard', 'Track your daily cloud security progress with a simple overview.');
  const roadmapItems = getRoadmapItems();
  const progress = getRoadmapProgress();
  const completedCount = getCompletedCount(roadmapItems, progress);
  const totalProgress = roadmapItems.length ? (completedCount / roadmapItems.length) * 100 : 0;
  const currentDay = roadmapItems[getCurrentDayIndex(roadmapItems, progress)] || roadmapItems[0];
  const studyLogs = getJson(STORAGE_KEYS.logs, []);
  const streak = calculateStreak(roadmapItems, progress);
  const weeklyGoal = Math.min(100, (completedCount / 7) * 100);

  main.innerHTML = `
    <section class="hero">
      <h3>Stay consistent for 6 months without making the tracker complicated.</h3>
      <p>This dashboard gives you a clean view of your roadmap, habits, and study progress. Every page saves data in localStorage so the site works offline and is easy to extend later.</p>
    </section>

    <section class="grid-cards">
      <article class="stat-box">
        <div class="stat-label">Current roadmap day</div>
        <div class="stat-value">${currentDay ? currentDay.day : 'Day 1'}</div>
        <div class="stat-foot">${currentDay ? currentDay.topic : 'No roadmap data'}</div>
      </article>
      <article class="stat-box">
        <div class="stat-label">Total progress</div>
        <div class="stat-value">${formatPercent(totalProgress)}</div>
        <div class="progress"><span style="width:${totalProgress}%"></span></div>
      </article>
      <article class="stat-box">
        <div class="stat-label">Study streak</div>
        <div class="stat-value">${streak} days</div>
        <div class="stat-foot">Based on completed roadmap days</div>
      </article>
      <article class="stat-box">
        <div class="stat-label">Tasks completed</div>
        <div class="stat-value">${completedCount}/${roadmapItems.length}</div>
        <div class="stat-foot">Roadmap items marked done</div>
      </article>
    </section>

    <section class="card section">
      <div class="section-head">
        <h4>Weekly goal progress</h4>
        <span class="badge info">Goal: 7 study days per week</span>
      </div>
      <div class="meter">
        <div class="meter-row"><span>Current week</span><span>${formatPercent(weeklyGoal)}</span></div>
        <div class="progress"><span style="width:${weeklyGoal}%"></span></div>
      </div>
    </section>

    <section class="split">
      <article class="card section">
        <div class="section-head">
          <h4>Quick summary</h4>
        </div>
        <div class="day-item">
          <div class="day-top">
            <div>
              <div class="day-meta">Next focus</div>
              <h5 class="day-title">${currentDay ? currentDay.topic : 'No upcoming topic'}</h5>
              <p class="day-text">${currentDay ? currentDay.whatToLearn : 'Finish your roadmap to unlock more days.'}</p>
            </div>
            <span class="badge success">${currentDay && progress[currentDay.id] ? 'Completed' : 'In progress'}</span>
          </div>
        </div>
      </article>

      <article class="card section">
        <div class="section-head">
          <h4>Recent study logs</h4>
        </div>
        <div class="log-list">
          ${studyLogs.slice(-3).reverse().map(entry => `
            <div class="log-item">
              <div class="log-top">
                <strong>${entry.date}</strong>
                <span class="badge">${entry.topic || 'Study log'}</span>
              </div>
              <div class="log-meta">${escapeHtml(entry.learned || 'No notes yet')}</div>
            </div>
          `).join('') || '<div class="empty">No study logs yet.</div>'}
        </div>
      </article>
    </section>
  `;
}

function calculateStreak(items, progress) {
  let streak = 0;
  for (let index = 0; index < items.length; index += 1) {
    if (progress[items[index].id]) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderRoadmap() {
  const main = createShell('Roadmap Tracker', 'Browse each phase, search your topics, and check days off as you finish them.');
  const roadmapItems = getRoadmapItems();
  let progress = getRoadmapProgress();
  let activePhase = 'All';
  let searchText = '';

  main.innerHTML = `
    <section class="card section">
      <div class="section-head">
        <h4>Roadmap progress</h4>
        <div class="toolbar">
          <input class="input" id="roadmapSearch" type="search" placeholder="Search topic, task, or command">
          <select class="select" id="phaseFilter">
            <option value="All">All months</option>
            ${Array.from(new Set(roadmapItems.map(item => item.phase))).map(phase => `<option value="${phase}">${phase}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="meter">
        <div class="meter-row"><span id="roadmapCount"></span><span id="roadmapPercent"></span></div>
        <div class="progress"><span id="roadmapProgressBar"></span></div>
      </div>
    </section>
    <div class="day-list" id="roadmapList"></div>
  `;

  const searchInput = document.getElementById('roadmapSearch');
  const phaseFilter = document.getElementById('phaseFilter');

  function getFilteredItems() {
    return roadmapItems.filter(item => {
      const matchesPhase = activePhase === 'All' || item.phase === activePhase;
      const haystack = `${item.phase} ${item.week} ${item.day} ${item.topic} ${item.whatToLearn} ${item.lab} ${item.miniChallenge} ${(item.practiceCommands || []).join(' ')} ${(item.topics || []).join(' ')}`.toLowerCase();
      const matchesSearch = haystack.includes(searchText.toLowerCase());
      return matchesPhase && matchesSearch;
    });
  }

  function renderList() {
    const filtered = getFilteredItems();
    const completed = getCompletedCount(roadmapItems, progress);
    const percent = roadmapItems.length ? (completed / roadmapItems.length) * 100 : 0;
    document.getElementById('roadmapCount').textContent = `${completed} of ${roadmapItems.length} days complete`;
    document.getElementById('roadmapPercent').textContent = formatPercent(percent);
    document.getElementById('roadmapProgressBar').style.width = `${percent}%`;

    document.getElementById('roadmapList').innerHTML = filtered.map(item => {
      const done = Boolean(progress[item.id]);
      /* Build YouTube search links */
      const ytLinks = (item.youtubeSearchTerms || []).map(
        (term, i) => `<a class="btn btn-ghost" href="https://www.youtube.com/results?search_query=${encodeURIComponent(term)}" target="_blank" rel="noreferrer">${escapeHtml(term)}</a>`
      ).join('');
      /* Build documentation links */
      const docLinks = (item.documentationLinks || []).map(
        link => `<a class="btn btn-ghost" href="${link.url}" target="_blank" rel="noreferrer">${escapeHtml(link.title)}</a>`
      ).join('');
      /* Build practice commands */
      const cmdList = (item.practiceCommands || []).slice(0, 6).map(
        cmd => `<code>${escapeHtml(cmd)}</code>`
      ).join(' ');
      /* Build topics list */
      const topicsList = (item.topics || []).map(
        t => `<span class="pill" style="font-size:0.75rem;">${escapeHtml(t)}</span>`
      ).join(' ');
      /* GitHub task */
      const ghTask = item.githubTask;
      const ghHtml = ghTask ? `<div class="day-text" style="margin-top:8px;"><strong>GitHub Task:</strong> ${escapeHtml(ghTask.title)} — ${escapeHtml(ghTask.description)}</div>` : '';

      return `
        <article class="day-item">
          <div class="day-top">
            <div style="flex:1;">
              <div class="day-meta">${item.phase} • ${item.week} • ${item.day} • <em>${escapeHtml(item.weekTheme || '')}</em></div>
              <h5 class="day-title">${escapeHtml(item.topic)}</h5>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0;">
                <span class="badge info">${item.difficulty}</span>
                <span class="badge">${item.estimatedTime}h</span>
              </div>
              <p class="day-text"><strong>Learning Objectives:</strong> ${escapeHtml(item.whatToLearn)}</p>
              ${topicsList ? `<div style="margin:8px 0;display:flex;gap:4px;flex-wrap:wrap;">${topicsList}</div>` : ''}
              <p class="day-text"><strong>Hands-on Tasks:</strong></p>
              <ul class="day-text" style="margin:4px 0 8px 18px;">${(item.lab || '').split(' | ').map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
              <p class="day-text"><strong>Mini Challenge:</strong> ${escapeHtml(item.miniChallenge)}</p>
              ${cmdList ? `<p class="day-text" style="margin-top:6px;"><strong>Commands:</strong> ${cmdList}</p>` : ''}
              ${ghHtml}
              ${item.revisionTopics && item.revisionTopics.length ? `<p class="day-text" style="margin-top:6px;"><strong>Revision:</strong> ${item.revisionTopics.map(t => escapeHtml(t)).join(' • ')}</p>` : ''}
            </div>
            <label class="badge ${done ? 'success' : 'warning'}" style="gap:8px; cursor:pointer; align-self:flex-start;">
              <input class="checkbox" type="checkbox" data-day-id="${item.id}" ${done ? 'checked' : ''}>
              ${done ? 'Completed' : 'Mark complete'}
            </label>
          </div>
          <div class="day-links" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
            ${ytLinks}
            ${docLinks}
          </div>
        </article>
      `;
    }).join('') || '<div class="empty">No roadmap items match your search.</div>';

    document.querySelectorAll('[data-day-id]').forEach(checkbox => {
      checkbox.addEventListener('change', event => {
        const { dayId } = event.target.dataset;
        progress[dayId] = event.target.checked;
        saveRoadmapProgress(progress);
        renderList();
      });
    });
  }

  searchInput.addEventListener('input', event => {
    searchText = event.target.value;
    renderList();
  });

  phaseFilter.addEventListener('change', event => {
    activePhase = event.target.value;
    renderList();
  });

  renderList();
}

function renderLogs() {
  const main = createShell('Daily Study Log', 'Write a short reflection every day to keep the learning journey clear.');
  const entries = getJson(STORAGE_KEYS.logs, []);
  let editingId = null;

  main.innerHTML = `
    <section class="card section">
      <div class="section-head">
        <h4>Add or edit a study log</h4>
        <span class="badge info">Saved in localStorage</span>
      </div>
      <form id="logForm" class="form-grid">
        <input class="input" name="date" type="date" required>
        <input class="input full" name="topic" type="text" placeholder="Topic or day focus" required>
        <textarea class="textarea full" name="learned" placeholder="What I learned" required></textarea>
        <textarea class="textarea" name="confused" placeholder="What confused me"></textarea>
        <textarea class="textarea" name="commands" placeholder="Commands practiced"></textarea>
        <textarea class="textarea" name="problems" placeholder="Problems faced"></textarea>
        <textarea class="textarea full" name="solution" placeholder="How I solved them"></textarea>
        <div class="full toolbar">
          <button class="btn btn-primary" type="submit" id="logSubmit">Save entry</button>
          <button class="btn btn-ghost" type="button" id="logReset">Clear form</button>
        </div>
      </form>
    </section>
    <section class="card section">
      <div class="section-head">
        <h4>Saved entries</h4>
      </div>
      <div class="log-list" id="logList"></div>
    </section>
  `;

  const form = document.getElementById('logForm');
  const submitButton = document.getElementById('logSubmit');
  const resetButton = document.getElementById('logReset');
  const renderList = () => {
    document.getElementById('logList').innerHTML = entries.slice().reverse().map(entry => `
      <div class="log-item">
        <div class="log-top">
          <div>
            <strong>${entry.date}</strong>
            <div class="log-meta">${escapeHtml(entry.topic)}</div>
          </div>
          <div class="toolbar">
            <button class="btn btn-ghost" data-edit-log="${entry.id}" type="button">Edit</button>
            <button class="btn btn-ghost" data-delete-log="${entry.id}" type="button">Delete</button>
          </div>
        </div>
        <p class="day-text"><strong>Learned:</strong> ${escapeHtml(entry.learned)}</p>
        <p class="day-text"><strong>Confused:</strong> ${escapeHtml(entry.confused || 'None')}</p>
        <p class="day-text"><strong>Commands:</strong> ${escapeHtml(entry.commands || 'None')}</p>
        <p class="day-text"><strong>Problems:</strong> ${escapeHtml(entry.problems || 'None')}</p>
        <p class="day-text"><strong>Solution:</strong> ${escapeHtml(entry.solution || 'None')}</p>
      </div>
    `).join('') || '<div class="empty">No study logs saved yet.</div>';

    document.querySelectorAll('[data-edit-log]').forEach(button => {
      button.addEventListener('click', () => {
        const entry = entries.find(item => item.id === button.dataset.editLog);
        if (!entry) return;
        editingId = entry.id;
        form.date.value = entry.date;
        form.topic.value = entry.topic;
        form.learned.value = entry.learned;
        form.confused.value = entry.confused;
        form.commands.value = entry.commands;
        form.problems.value = entry.problems;
        form.solution.value = entry.solution;
        submitButton.textContent = 'Update entry';
      });
    });

    document.querySelectorAll('[data-delete-log]').forEach(button => {
      button.addEventListener('click', () => {
        const index = entries.findIndex(item => item.id === button.dataset.deleteLog);
        if (index === -1) return;
        entries.splice(index, 1);
        setJson(STORAGE_KEYS.logs, entries);
        renderList();
      });
    });
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const entry = {
      id: editingId || `log-${Date.now()}`,
      date: data.get('date'),
      topic: data.get('topic'),
      learned: data.get('learned'),
      confused: data.get('confused') || '',
      commands: data.get('commands') || '',
      problems: data.get('problems') || '',
      solution: data.get('solution') || ''
    };

    const existingIndex = entries.findIndex(item => item.id === entry.id);
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }

    setJson(STORAGE_KEYS.logs, entries);
    editingId = null;
    submitButton.textContent = 'Save entry';
    form.reset();
    renderList();
  });

  resetButton.addEventListener('click', () => {
    editingId = null;
    submitButton.textContent = 'Save entry';
    form.reset();
  });

  form.date.valueAsDate = new Date();
  renderList();
}

function renderSkills() {
  const main = createShell('Skill Tracker', 'Skills are automatically calculated from your roadmap completion.');
  const calculatedSkills = calculateSkillsFromRoadmap();
  
  main.innerHTML = `
    <section class="card section">
      <div class="section-head">
        <h4>Auto-calculated Skills</h4>
        <span class="badge success">Based on completed roadmap items</span>
      </div>
      <p style="margin-bottom: 20px; color: #999;">Skills are calculated automatically as you complete roadmap tasks. Each task is tagged with topics, and your skill level increases as you complete tasks related to that skill.</p>
      <div class="list" id="skillList"></div>
    </section>
  `;

  const skillList = document.getElementById('skillList');
  skillList.innerHTML = SKILL_LABELS.map(label => {
    const percentage = calculatedSkills[label] ?? 0;
    let badgeClass = 'warning';
    if (percentage >= 75) badgeClass = 'success';
    else if (percentage >= 50) badgeClass = 'info';
    
    return `
    <div class="day-item">
      <div class="meter-row">
        <strong>${label}</strong>
        <span class="badge ${badgeClass}">${percentage}%</span>
      </div>
      <div class="progress"><span style="width:${percentage}%"></span></div>
    </div>
  `;
  }).join('');
}

function renderProjects() {
  const main = createShell('Project Tracker', 'Keep track of small projects, lab builds, and portfolio ideas.');
  const projects = getJson(STORAGE_KEYS.projects, []);

  main.innerHTML = `
    <section class="card section">
      <div class="section-head">
        <h4>Add project</h4>
      </div>
      <form id="projectForm" class="form-grid">
        <input class="input full" name="name" type="text" placeholder="Project name" required>
        <select class="select" name="status">
          ${PROJECT_STATUSES.map(status => `<option value="${status}">${status}</option>`).join('')}
        </select>
        <textarea class="textarea full" name="notes" placeholder="Project notes"></textarea>
        <div class="full toolbar">
          <button class="btn btn-primary" type="submit">Save project</button>
        </div>
      </form>
    </section>
    <section class="card section">
      <div class="section-head">
        <h4>Projects</h4>
      </div>
      <div class="project-list" id="projectList"></div>
    </section>
  `;

  const form = document.getElementById('projectForm');
  const renderList = () => {
    document.getElementById('projectList').innerHTML = projects.map(project => `
      <div class="project-item">
        <div class="project-top">
          <div>
            <strong>${escapeHtml(project.name)}</strong>
            <div class="project-meta">${escapeHtml(project.notes || 'No notes yet')}</div>
          </div>
          <div class="toolbar">
            <select class="select" data-project-status="${project.id}">
              ${PROJECT_STATUSES.map(status => `<option value="${status}" ${status === project.status ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
            <button class="btn btn-ghost" type="button" data-delete-project="${project.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('') || '<div class="empty">No projects added yet.</div>';

    document.querySelectorAll('[data-project-status]').forEach(select => {
      select.addEventListener('change', event => {
        const project = projects.find(item => item.id === event.target.dataset.projectStatus);
        if (!project) return;
        project.status = event.target.value;
        setJson(STORAGE_KEYS.projects, projects);
      });
    });

    document.querySelectorAll('[data-delete-project]').forEach(button => {
      button.addEventListener('click', () => {
        const index = projects.findIndex(item => item.id === button.dataset.deleteProject);
        if (index === -1) return;
        projects.splice(index, 1);
        setJson(STORAGE_KEYS.projects, projects);
        renderList();
      });
    });
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    projects.push({
      id: `project-${Date.now()}`,
      name: data.get('name'),
      status: data.get('status'),
      notes: data.get('notes') || ''
    });
    setJson(STORAGE_KEYS.projects, projects);
    form.reset();
    renderList();
  });

  renderList();
}

function renderNotes() {
  const main = createShell('Notes Page', 'Store simple notes by topic and keep them easy to search later.');
  const notes = getJson(STORAGE_KEYS.notes, []);
  let editingNoteId = null;

  main.innerHTML = `
    <section class="card section">
      <div class="section-head">
        <h4>Add note</h4>
      </div>
      <form id="noteForm" class="form-grid">
        <select class="select" name="category" required>
          ${NOTE_CATEGORIES.map(category => `<option value="${category}">${category}</option>`).join('')}
        </select>
        <input class="input" name="title" type="text" placeholder="Note title" required>
        <textarea class="textarea full" name="content" placeholder="Write your note here" required></textarea>
        <div class="full toolbar">
          <button class="btn btn-primary" type="submit" id="noteSubmit">Save note</button>
          <button class="btn btn-ghost" type="button" id="noteReset">Clear form</button>
        </div>
      </form>
    </section>
    <section class="card section">
      <div class="section-head">
        <h4>Saved notes</h4>
      </div>
      <div class="note-list" id="noteList"></div>
    </section>
  `;

  const form = document.getElementById('noteForm');
  const submitButton = document.getElementById('noteSubmit');
  const resetButton = document.getElementById('noteReset');
  const renderList = () => {
    document.getElementById('noteList').innerHTML = notes.map(note => `
      <div class="note-item">
        <div class="note-top">
          <div>
            <strong>${escapeHtml(note.title)}</strong>
            <div class="note-meta">${escapeHtml(note.category)}</div>
          </div>
          <div class="toolbar">
            <button class="btn btn-ghost" type="button" data-edit-note="${note.id}">Edit</button>
            <button class="btn btn-ghost" type="button" data-delete-note="${note.id}">Delete</button>
          </div>
        </div>
        <p class="day-text">${escapeHtml(note.content)}</p>
      </div>
    `).join('') || '<div class="empty">No notes saved yet.</div>';

    document.querySelectorAll('[data-delete-note]').forEach(button => {
      button.addEventListener('click', () => {
        const index = notes.findIndex(item => item.id === button.dataset.deleteNote);
        if (index === -1) return;
        notes.splice(index, 1);
        setJson(STORAGE_KEYS.notes, notes);
        renderList();
      });
    });

    document.querySelectorAll('[data-edit-note]').forEach(button => {
      button.addEventListener('click', () => {
        const note = notes.find(item => item.id === button.dataset.editNote);
        if (!note) return;
        editingNoteId = note.id;
        form.category.value = note.category;
        form.title.value = note.title;
        form.content.value = note.content;
        submitButton.textContent = 'Update note';
      });
    });
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const note = {
      id: editingNoteId || `note-${Date.now()}`,
      category: data.get('category'),
      title: data.get('title'),
      content: data.get('content')
    };

    const existingIndex = notes.findIndex(item => item.id === note.id);
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }

    setJson(STORAGE_KEYS.notes, notes);
    editingNoteId = null;
    submitButton.textContent = 'Save note';
    form.reset();
    renderList();
  });

  resetButton.addEventListener('click', () => {
    editingNoteId = null;
    submitButton.textContent = 'Save note';
    form.reset();
  });

  renderList();
}

async function loadRoadmapData() {
  try {
    const response = await fetch('roadmap.json');
    if (!response.ok) throw new Error('Roadmap JSON unavailable');
    const json = await response.json();
    /* Support both {roadmap:{months:[...]}} and flat array formats */
    if (json.roadmap && json.roadmap.months) {
      ROADMAP_DATA = json.roadmap.months;
    } else if (Array.isArray(json)) {
      ROADMAP_DATA = json;
    } else {
      ROADMAP_DATA = [];
    }
  } catch (err) {
    console.warn('Could not load roadmap.json, using empty data:', err);
    ROADMAP_DATA = [];
  }
}

async function init() {
  await loadRoadmapData();
  const page = document.body.dataset.page;

  switch (page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'roadmap':
      renderRoadmap();
      break;
    case 'logs':
      renderLogs();
      break;
    case 'skills':
      renderSkills();
      break;
    case 'projects':
      renderProjects();
      break;
    case 'notes':
      renderNotes();
      break;
    default:
      renderDashboard();
  }
}

document.addEventListener('DOMContentLoaded', init);
