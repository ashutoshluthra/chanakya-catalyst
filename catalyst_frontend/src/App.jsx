import React, { useState, useEffect, useCallback, useRef } from 'react';
const API_URL = "https://catalyst-backend-x5c6.onrender.com"; // Replace with YOUR actual Render URL

// --- MOCK DATA ---
const initialTasks = [
  { id: 1, name: "Project Alpha: ARD (Architecture Document) Draft", status: 'Pending', type: 'Augmentation', points: 150, risk: false, isComplete: false, projectId: 'client-acme-1' },
  { id: 2, name: "Project Beta: Meeting Summary (10/22)", status: 'Review', type: 'Augmentation', points: 100, risk: false, isComplete: false, projectId: 'client-acme-1' },
  { id: 3, name: "Project Gamma: Security Audit Plan Outline", status: 'Pending', type: 'Augmentation', points: 200, risk: false, isComplete: false, projectId: 'client-zeta-2' },
  { id: 4, name: "Client Z: Final Project Closeout Report", status: 'Complete', type: 'Augmentation', points: 0, risk: false, isComplete: true, projectId: 'client-acme-1' },
];

const mockCertificates = [
    { id: 'ai-aug-spec', name: "AI Augmentation Specialist", course: "Level 1: Dynamic Task Augmentation", issuedBy: "Chanakya's Catalyst", issuedTo: "Aluthra (PS Consultant)", issuedDate: "2025-10-22", hours: 12 },
    { id: 'so-gov-cert', name: "S&O Governance Certified", course: "Operational Health Check Mastery", issuedBy: "Chanakya's Catalyst", issuedTo: "Aluthra (PS Consultant)", issuedDate: "2025-08-15", hours: 8 },
];

const learningModules = [
  { name: "Prompt Engineering: Advanced Client Summaries", progress: 85, daysLeft: 2 },
  { name: "S&O Compliance: Cloud Migration Architecture", progress: 40, daysLeft: 7 },
  { name: "Data Ethics for Client-Facing Deliverables", progress: 100, daysLeft: 0 },
];

const mockLeaderboard = [
    { rank: 1, name: "Kunal", points: 3400, augmentedTasks: 35 },
    { rank: 2, name: "Raghav", points: 2950, augmentedTasks: 28 },
    { rank: 3, name: "Aluthra", points: 1250, augmentedTasks: 12 },
    { rank: 4, name: "Ankit", points: 900, augmentedTasks: 8 },
    { rank: 5, name: "Gaurav", points: 650, augmentedTasks: 5 },
];

// This list contains sample action items used in the Project View (hardcoded for demo)
const mockActionItems = [
    { id: 'a1', projectId: 'client-acme-1', task: 'Finalize SOW Amendment', owner: 'Arjun', due: '2025-10-25', status: 'Pending' },
    { id: 'a2', projectId: 'client-zeta-2', task: 'Review new Cortex XDR Deployment Guide', owner: 'Aluthra', due: '2025-10-28', status: 'Pending' },
    { id: 'a3', projectId: 'client-acme-1', task: 'Submit Final Project Closeout Report', owner: 'Aluthra', due: '2025-10-23', status: 'Completed' },
];

const mockProjects = {
    'client-acme': {
        name: "Client ACME Corp.",
        projects: [
            { id: 'client-acme-1', name: "Digital Transformation Phase 2", documents: ['Project Charter (v1.2)', 'Final ARD - Cloud Architecture', 'SOW Amendment'], status: 'Active' },
            { id: 'client-acme-2', name: "Legacy System Decommission", documents: ['Decommission Plan', 'Risk Assessment'], status: 'Closed' }
        ]
    },
    'client-zeta': {
        name: "Client Zeta Solutions",
        projects: [
            { id: 'client-zeta-1', name: "Data Pipeline Optimization", documents: ['Data Pipeline Diagram', 'Performance Audit'], status: 'Closed' },
            { id: 'client-zeta-2', name: "Threat Detection Overhaul", documents: ['Security Audit Plan', 'Cortex XDR Deployment Guide'], status: 'Active' }
        ]
    }
};

const initialLiveSummary = {
    executive_summary: "Paste a raw transcript in the box below and click 'Run Live Structured Summary' to test the Gemini Gem.",
    action_items: [],
    potential_blockers: [],
};
// --- END MOCK DATA ---

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      return storedTheme === 'dark';
    }
    return false;
  });

  const [tasks, setTasks] = useState(initialTasks);
  const [points, setPoints] = useState(1250); // Initial points for dynamic update
  const [badges] = useState(mockCertificates.length);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'certificates', 'leaderboard', or 'projects'
  const [selectedTask, setSelectedTask] = useState(initialTasks[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  // FIX: Using Ref for stability and accessing value on button click
  const liveTranscriptRef = useRef(null); 
  const skillQueryRef = useRef(null); 
  
  const [liveSummaryData, setLiveSummaryData] = useState(initialLiveSummary);
  const [validationStatus, setValidationStatus] = useState({ status: 'Awaiting Final Review', risk: null });
  const [projectActionItems, setProjectActionItems] = useState(mockActionItems);
  
  // Restored to stable state without complex state variables that caused crashes
  const [skillResponse, setSkillResponse] = useState(null);
  const [skillLoading, setSkillLoading] = useState(false);
  // NEW: States for AI Remediation Coaching
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [coachingResponse, setCoachingResponse] = useState(null);
  
  // Load external scripts (html2canvas, jsPDF)
  useEffect(() => {
    const scripts = [
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    ];
    scripts.forEach(src => {
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.head.appendChild(script);
        }
    });
  }, []);
useEffect(() => {
    // CRITICAL FIX: Ensure loading states are FALSE on initial component mount
    // This resolves issues where a crash/error handler might leave the state TRUE.
    if (isLoading) {
        setIsLoading(false);
    }
    if (skillLoading) {
        setSkillLoading(false);
    }
}, []);
  // --- Dark Mode Handler ---
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.removeItem('theme'); 
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
    // setIsDarkMode(!isDarkMode); 
  };
// --- AI Remediation Coach Handler ---
// App.jsx (Finalized function that integrates the fetch call)
const handleCoachingRequest = async () => {
    // 1. Check if a violation has occurred and get the first violation's details
    if (validationStatus.risk !== 'fail' || !validationStatus.findings || validationStatus.findings.length === 0) {
        setCoachingResponse("No Major Risk findings to coach on.");
        return;
    }

    setCoachingLoading(true);
    setCoachingResponse(null);

    // Construct a specific prompt based on the flagged MAJOR RISK findings.
    const findingsSummary = validationStatus.findings
        .map(f => `Violation: ${f.violation}. Impact: ${f.impact}`)
        .join('; ');

    const userPrompt = `The consultant's document failed S&O validation with the following findings: ${findingsSummary}. Provide a 3-step actionable plan to fix these issues.`;

    try {
        // Initiate the fetch call to the compliant backend route
        const response = await fetch('${API_URL}/api/remediate-coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success' && result.text) {
            setCoachingResponse(result.text);
        } else {
            setCoachingResponse(`AI Coach Error: ${result.message || 'Failed to generate plan.'}`);
        }

    } catch (error) {
        console.error("Remediation Coach connection error:", error);
        setCoachingResponse(`CONNECTION FAILED: ${error.message}. Cannot access AI Coach.`);
    } finally {
        setCoachingLoading(false);
    }
};


  // --- Task Handlers ---
  const handleTaskSelect = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task);
    setLiveSummaryData(initialLiveSummary);
    setValidationStatus({ status: 'Awaiting Final Review', risk: null });
  };

  const updatePoints = useCallback((amount) => {
    setPoints(prev => Math.max(0, prev + amount));
  }, []);

  
  const handleValidation = useCallback((isPass) => {
    setIsLoading(true);
    // Simulate back-end processing delay
    setTimeout(() => {
      if (isPass) {
        setValidationStatus({ status: 'PASS: S&O Compliant', risk: 'pass' });
        updatePoints(150);
        const updatedTasks = tasks.map(t => t.id === selectedTask.id ? { ...t, isComplete: true, status: 'Complete' } : t);
        setTasks(updatedTasks);
        setSelectedTask(updatedTasks.find(t => t.id === selectedTask.id));
      } else {
        setValidationStatus({ 
          status: 'MAJOR RISK: Policy Violation Detected', 
          risk: 'fail',
          findings: [
            { violation: 'Non-Standard Data Structure', impact: 'Prevents automatic data ingestion by client systems.' },
            { violation: 'Missing Security Protocol', impact: 'Exposes data bucket to external attack during deployment.' }
          ]
        });
        updatePoints(-50); // Minor penalty for failing to catch a compliance risk
      }
      setIsLoading(false);
    }, 1500);
  }, [tasks, selectedTask, updatePoints]);
  
  const toggleActionItem = (id) => {
    setProjectActionItems(prevItems => 
        prevItems.map(item => 
            item.id === id 
            ? { ...item, status: item.status === 'Completed' ? 'Pending' : 'Completed' }
            : item
        )
    );
  };

  // --- Gemini Feature 2: Quick Skill Generator (Literacy) ---
  const handleSkillGenerator = async () => {
    const query = skillQueryRef.current ? skillQueryRef.current.value.trim() : '';
    
    if (!query) {
        setSkillResponse("Please enter a topic to generate a quick skill summary.");
        return;
    }
    setSkillLoading(true);
    setSkillResponse(null);
    const userPrompt = `You are a PS Subject Matter Expert. Provide a 3-paragraph, executive-level summary and its primary relevance to Professional Services consulting for the following topic: "${query}".`;

    try {
        const response = await fetch('${API_URL}/api/quick-skill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt }),
        });

        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        
        const result = await response.json();
        setSkillResponse(result.text || "Failed to generate skill summary.");

    } catch (error) {
        setSkillResponse(`Skill Generator connection error: ${error.message}`);
    } finally {
        setSkillLoading(false);
    }
  };


  // --- Live API Call Logic (Phase 2 Logic) ---
  const handleLiveSummarize = async () => {
    const transcript = liveTranscriptRef.current ? liveTranscriptRef.current.value.trim() : '';
    
    if (transcript.length < 50) {
      alert("Please paste a transcript of at least 50 characters to run the AI.");
      return;
    }
    
    setIsLoading(true);
    setLiveSummaryData({ executive_summary: "Orchestrating Gemini API... Analyzing transcript structure...", action_items: [], potential_blockers: [] });

    try {
      const response = await fetch('${API_URL}/api/process-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}. Is the backend running on Render?`);
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.summary) {
        setLiveSummaryData(result.summary);
      } else {
         setLiveSummaryData({ executive_summary: `AI Processing Error: ${result.message || 'Received structure could not be read.'}`, action_items: [], potential_blockers: [] });
      }

    } catch (error) {
      console.error("Live Augmentation Error:", error);
      setLiveSummaryData({ executive_summary: `CONNECTION FAILED: ${error.message}. Check console for details.`, action_items: [], potential_blockers: [] });
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- PDF Generation Logic ---
  // const generatePDF = (certId) => {
  //   const certElement = document.getElementById(`certificate-${certId}`);
  //   if (!certElement || typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
  //       alert("PDF libraries not fully loaded or element missing. Please wait a moment and try again.");
  //       return;
  //   }
    
  //   certElement.style.backgroundColor = '#ffffff'; 
  //   certElement.style.boxShadow = 'none'; 

  //   window.html2canvas(certElement, { 
  //       scale: 2, 
  //       useCORS: true,
  //       allowTaint: true,
  //   }).then(canvas => {
  //       const imgData = canvas.toDataURL('image/png');
  //       const pdf = new window.jspdf.jsPDF({
  //           orientation: 'landscape',
  //           unit: 'px',
  //           format: [canvas.width, canvas.height] 
  //       });

  //       pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        
  //       const certName = mockCertificates.find(c => c.id === certId)?.name || 'Certificate';
  //       pdf.save(`${certName}_${new Date().toISOString().slice(0, 10)}.pdf`);
        
  //       certElement.style.backgroundColor = ''; 
  //       certElement.style.boxShadow = '';
  //   }).catch(err => {
  //       console.error("PDF generation failed:", err);
  //       alert("PDF generation failed. Check console for details.");
  //   });
  // };

// App.jsx (Finalized generatePDF function, removing direct style manipulation)

const generatePDF = (certId) => {
    const certElement = document.getElementById(`certificate-${certId}`);
    
    // Safety check to ensure libraries are available
    if (!certElement || typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        alert("PDF libraries not fully loaded or element missing. Please wait a moment and try again.");
        return;
    }

    // NOTE: Direct style neutralization code (certElement.style.color = '#000000', etc.) 
    // and the class addition/removal logic are removed here.
    
    window.html2canvas(certElement, { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height] 
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        
        const certName = mockCertificates.find(c => c.id === certId)?.name || 'Certificate';
        pdf.save(`${certName}_${new Date().toISOString().slice(0, 10)}.pdf`);
        
    }).catch(err => {
        console.error("PDF generation failed:", err);
        alert("PDF generation failed. Check console for details.");
    })
    // No .finally() block is needed here as the style manipulation/cleanup is removed.
    // If your original working logic included cleanup, you can include that, but 
    // the code provided assumes the final, clean state without the redundant style overrides.
};


  // --- UI Components ---
  
  const Sidebar = () => (
    <div className="w-full lg:w-72 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2 border-gray-300 dark:border-gray-600">AI-Assisted Drafts ({tasks.filter(t => !t.isComplete).length})</h2>
      
      {tasks.filter(t => !t.isComplete).map(task => (
        <div 
          key={task.id} 
          onClick={() => handleTaskSelect(task.id)}
          className={`p-3 mb-3 rounded-lg shadow-sm cursor-pointer transition duration-150 ease-in-out 
                      ${selectedTask && selectedTask.id === task.id ? 'bg-amber-100 dark:bg-amber-600 border-l-4 border-amber-500 dark:border-amber-400' : 'bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
        >
          <div className="flex justify-between items-center">
            <p className={`font-semibold ${selectedTask && selectedTask.id === task.id ? 'text-amber-900 dark:text-white' : 'text-gray-800 dark:text-gray-100'}`}>
              {task.name}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'Review' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>
              {task.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Value: {task.points} pts</p>
        </div>
      ))}

      <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white border-b pb-2 border-gray-300 dark:border-gray-600">Completed Tasks</h3>
      {tasks.filter(t => t.isComplete).map(task => (
        <div key={task.id} className="p-3 mb-3 rounded-lg bg-green-50 dark:bg-green-800 shadow-sm opacity-70">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">{task.name}</p>
          <p className="text-xs text-green-600 dark:text-green-300">Completed</p>
        </div>
      ))}
    </div>
  );
  
  const StatCard = ({ title, value, unit, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-700 p-5 rounded-xl shadow-lg border-b-4 border-${color}-500 dark:border-${color}-400 transform hover:scale-[1.02] transition duration-300 ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}`}
    >
      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{title}</p>
      <div className="mt-1 flex items-baseline">
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
        <span className="ml-2 text-sm font-semibold text-amber-600 dark:text-amber-300">{unit}</span>
      </div>
    </div>
  );

  const LearningProgress = ({ name, progress, daysLeft }) => {
    const barColor = progress === 100 ? 'bg-green-500' : 'bg-yellow-500';
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
          <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{daysLeft > 0 ? `${daysLeft} days to deadline` : 'Complete'}</p>
      </div>
    );
  };

  const ActionItemCard = ({ task, owner, due_date }) => (
    <li className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mb-2 border border-gray-200 dark:border-gray-700">
      <p className="font-medium text-gray-800 dark:text-gray-100">{task}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Owner: <span className="font-semibold">{owner}</span> | Due: <span className="font-semibold text-amber-600 dark:text-amber-400">{due_date}</span>
      </p>
    </li>
  );

  const RiskFinding = ({ violation, impact }) => (
    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md border-l-4 border-red-500">
      <p className="font-bold text-red-800 dark:text-red-100">⚠️ Violation: {violation}</p>
      <p className="text-sm text-red-700 dark:text-red-200 mt-1">
        **Impact:** {impact}
      </p>
    </div>
  );
  
  const ViewSwitcher = () => (
    <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-full shadow-inner text-sm font-medium">
      <button
        onClick={() => setView('dashboard')}
        className={`px-4 py-2 rounded-full transition-colors ${view === 'dashboard' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
      >
        Dashboard
      </button>
      <button
        onClick={() => setView('certificates')}
        className={`px-4 py-2 rounded-full transition-colors ${view === 'certificates' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
      >
        Certificates ({badges})
      </button>
       <button
        onClick={() => setView('leaderboard')}
        className={`px-4 py-2 rounded-full transition-colors ${view === 'leaderboard' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
      >
        Leaderboard
      </button>
      <button
        onClick={() => setView('projects')}
        className={`px-4 py-2 rounded-full transition-colors ${view === 'projects' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
      >
        Projects
      </button>
    </div>
  );

  const Header = () => (

    <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        
        {/* === START LOGO AND TITLE WRAPPER FIX === */}
        <div 
            // Use flex-items-center and space-x-2 for alignment and spacing
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => setView('dashboard')}
        >
            {/* The Logo Image */}
            <img 
                src="/brand-logo.png" 
                alt="Catalyst Logo" 
                // Set fixed height and auto width for responsiveness
                className="h-18 w-auto" 
            />
            {/* The Title - Changed from <h1> to <span> for flex alignment */}
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              Chanakya's Catalyst
            </span>
        </div>
        {/* === END LOGO AND TITLE WRAPPER FIX === */}
    {/* <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 cursor-pointer" onClick={() => setView('dashboard')}>
          Chanakya's Catalyst
        </h1> */}
       
        <div className="hidden lg:block">
            <ViewSwitcher />
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleDarkMode} 
            className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun">
                <circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </svg>
            )}
          </button>
          <span className="font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">Consultant Dashboard</span>
        </div>
      </div>
      <div className="lg:hidden mt-2 flex justify-center">
         <ViewSwitcher />
      </div>
    </header>
  );

  const CertificateSeal = () => (
    <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center shadow-lg transform rotate-12">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award">
          <circle cx="12" cy="8" r="7"></circle>
          <path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11"></path>
      </svg>
    </div>
  );

  const CertificateDisplay = ({ cert }) => (
    // Outer Frame: High Aesthetic Contrast and Depth (Simplified for PDF stability)
    // <div id={`certificate-${cert.id}`} className="w-full max-w-4xl bg-white mx-auto my-8 relative overflow-hidden font-serif border-4 border-amber-500" style={{ minHeight: '600px' }}>
    <div 
    id={`certificate-${cert.id}`} 
    // Add the class here
    className={`cert-fix-color w-full max-w-4xl mx-auto my-8 relative overflow-hidden font-serif border-4 border-amber-500`} 
    style={{ minHeight: '600px' }}
> 
        {/* Navy Header Band */}
        <div className="bg-gray-900 h-24 p-6 flex justify-between items-center relative z-10 shadow-lg">
            <h1 className="text-4xl font-extrabold text-amber-400 tracking-widest">CHANAKYA'S CATALYST</h1>
            {/* Gold Seal Placeholder */}
            <CertificateSeal />
        </div>

        {/* Main Content Area */}
        <div className="p-16 relative z-10 text-gray-800">
            
            <div className="text-center">
                <p className="text-xl font-light text-gray-600 tracking-wider">CERTIFICATE OF ACHIEVEMENT GRANTED TO</p>
                
                {/* Recipient Name */}
                <div className="my-6">
                    <p className="text-6xl font-extrabold text-gray-900 tracking-tighter border-b-4 border-amber-500 inline-block px-8 pb-1">
                        {cert.issuedTo}
                    </p>
                </div>
                
                <p className="text-xl font-medium text-gray-800 mt-4 mb-10">FOR SUCCESSFULLY COMPLETING THE RIGOROUS PROGRAM:</p>
            </div>

            {/* Course Title */}
            <div className="text-center mb-16">
                <p className="text-4xl font-bold italic cert-fix-color px-8 py-3 bg-amber-50 border-2 border-amber-300 inline-block rounded-xl">
                    {cert.name}: {cert.course}
                </p>
            </div>

            {/* Signature and Date Footers */}
            <div className="flex justify-around mt-16 text-sm max-w-3xl mx-auto">
                <div className="flex-1 text-center mx-6">
                    <p className="border-t-2 border-gray-500 pt-2 font-semibold text-gray-800">{cert.issuedDate}</p>
                    <p className="text-sm text-gray-600">Date of Grant</p>
                </div>
                <div className="flex-1 text-center mx-6">
                    <p className="border-t-2 border-gray-500 pt-2 font-semibold text-gray-800">{cert.hours} Hours Training</p>
                    <p className="text-sm text-gray-600">Duration & Rigor</p>
                </div>
                <div className="flex-1 text-center mx-6">
                    <p className="border-t-2 border-gray-500 pt-2 font-semibold text-gray-800">Director of S&O</p>
                    <p className="text-sm text-gray-600">Authorizing Signature</p>
                </div>
            </div>
        </div>
    </div>
  );
  
  const CertificatesView = () => (
    <div className="p-6 space-y-8 flex-grow overflow-y-auto w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center border-b pb-3 border-gray-300 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Professional Certifications ({mockCertificates.length})</h2>
            <button
                onClick={() => setView('dashboard')}
                className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition hidden sm:inline-flex"
            >
                ← Back to Dashboard
            </button>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 text-lg">
            These certifications validate your expertise in AI Augmentation and S&O Governance, directly enhancing your professional profile and client trust.
        </p>

        {mockCertificates.map((cert) => (
            <div key={cert.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">{cert.name}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{cert.course}</p>
                    </div>
                     <button 
                        onClick={() => generatePDF(cert.id)}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-3-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path></svg>
                        <span>Download/Share PDF</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-semibold block text-gray-800 dark:text-gray-200">Issued Date:</span> {cert.issuedDate}</p>
                    <p><span className="font-semibold block text-gray-800 dark:text-gray-200">Issued By:</span> {cert.issuedBy}</p>
                    <p><span className="font-semibold block text-gray-800 dark:text-gray-200">Duration:</span> {cert.hours} hrs</p>
                    <p><span className="font-semibold block text-gray-800 dark:text-gray-200">Status:</span> Achieved</p>
                </div>
                
                {/* Certificate Render (Hidden for PDF generation) */}
                <div className="absolute left-[-9999px]">
                    <CertificateDisplay cert={cert} />
                </div>
            </div>
        ))}
    </div>
  );
  
  const LeaderboardView = () => {
    // Merge mock data with current user score dynamically and re-sort
    const dynamicLeaderboard = mockLeaderboard.map(user => {
        if (user.name === 'Aluthra') {
            return { ...user, points: points }; // Use current state points
        }
        return user;
    }).sort((a, b) => b.points - a.points); // Re-sort by points

    return (
        <div className="p-6 space-y-6 flex-grow overflow-y-auto w-full max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gamification Leaderboard</h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
                Compete for top efficiency. Points are awarded for **Augmented Task Completion** and **S&O Compliance Rigor**.
            </p>

            <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="grid grid-cols-4 py-3 px-6 text-left font-bold text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <span>Rank</span>
                    <span>Consultant</span>
                    <span className="text-center">Catalyst Points</span>
                    <span className="text-right">Tasks Augmented</span>
                </div>
                {dynamicLeaderboard.map((user, index) => (
                    <div 
                        key={index} 
                        className={`grid grid-cols-4 py-4 px-6 border-b transition-colors 
                                    ${user.name === 'Aluthra' ? 'bg-amber-50 dark:bg-amber-900 font-extrabold text-amber-700 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'} 
                                    ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/50' : ''}`}
                    >
                        <span className="text-lg font-bold">{index + 1}</span>
                        <span className="text-lg">{user.name}</span>
                        <span className="text-lg text-center">{user.points.toLocaleString()}</span>
                        <span className="text-lg text-right">{user.augmentedTasks}</span>
                    </div>
                ))}
            </div>
        </div>
    );
  };
  
  const ActionItemTracker = ({ projectId, projectName, actionItems, toggleActionItem }) => {
    // Filter action items specific to this project
    const projectItems = actionItems.filter(item => item.projectId === projectId);
    const completedItems = projectItems.filter(item => item.status === 'Completed');
    const pendingItems = projectItems.filter(item => item.status === 'Pending');

    return (
        <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                Action Items Tracking ({pendingItems.length} Pending)
            </h4>
            <div className="space-y-3">
                {pendingItems.map(item => (
                    <div key={item.id} className="flex items-start p-3 bg-red-50 dark:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-700">
                        <input
                            type="checkbox"
                            checked={item.status === 'Completed'}
                            onChange={() => toggleActionItem(item.id)}
                            className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-red-300 rounded focus:ring-red-500"
                        />
                        <div className="ml-3 text-sm flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.task}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">Owner: {item.owner} | Due: <span className="font-semibold text-red-700 dark:text-red-300">{item.due}</span></p>
                        </div>
                    </div>
                ))}

                {completedItems.length > 0 && (
                    <h5 className="text-md font-semibold text-green-600 dark:text-green-400 pt-3">Completed ({completedItems.length})</h5>
                )}
                {completedItems.map(item => (
                    <div key={item.id} className="flex items-start p-3 bg-green-50 dark:bg-green-800/50 rounded-lg opacity-70 border border-green-200 dark:border-green-700 line-through">
                         <input type="checkbox" checked={true} readOnly className="mt-1 w-4 h-4 text-green-600 bg-gray-100 border-green-300 rounded"/>
                        <div className="ml-3 text-sm">
                            <p className="font-medium text-gray-600 dark:text-gray-400">{item.task}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const ProjectItem = ({ projectId, projectName, clientName, documents, status }) => {
    const projectStatusColor = status === 'Active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const pendingTasks = projectTasks.filter(task => !task.isComplete).length;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-3">
            <div className="flex justify-between items-center border-b pb-3">
                <div>
                    <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">{projectName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Client: {clientName}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${projectStatusColor}`}>
                    {status}
                </span>
            </div>

            <div className="grid grid-cols-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">Total Documents: <span className="font-semibold">{documents.length}</span></p>
                <p className="text-gray-700 dark:text-gray-300 text-right">
                    <span className="font-semibold text-red-500">{pendingTasks}</span> Catalyst Tasks Pending
                </p>
            </div>

            <div className="mt-3">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Key Documents & Artifacts:</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-300">
                    {documents.map((doc, index) => (
                        <li key={index} className="hover:text-amber-500 cursor-pointer">{doc}</li>
                    ))}
                </ul>
            </div>

            {/* INTEGRATED ACTION ITEM TRACKER */}
            <ActionItemTracker 
                projectId={projectId} 
                projectName={projectName} 
                actionItems={projectActionItems} 
                toggleActionItem={toggleActionItem}
            />
        </div>
    );
  };
  
  const ProjectsView = () => {
    // Flatten the mockProjects structure
    const projectsList = [];
    Object.keys(mockProjects).forEach(clientKey => {
        const client = mockProjects[clientKey];
        client.projects.forEach(project => {
            projectsList.push({ ...project, clientName: client.name });
        });
    });

    // Group projects by status for display
    const activeProjects = projectsList.filter(p => p.status === 'Active');
    const closedProjects = projectsList.filter(p => p.status === 'Closed');

    return (
        <div className="p-6 space-y-6 flex-grow overflow-y-auto w-full max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">Project Portfolio & Document Management</h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
                View all active and closed client engagements. Documentation and live action items are managed here for easy access and audit.
            </p>

            <h3 className="text-2xl font-semibold text-green-600 dark:text-green-400 pt-4">Active Engagements ({activeProjects.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProjects.map(project => (
                    <ProjectItem 
                        key={project.id} 
                        projectId={project.id}
                        projectName={project.name} 
                        clientName={project.clientName} 
                        documents={project.documents} 
                        status={project.status} 
                    />
                ))}
            </div>

            <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">Closed Projects ({closedProjects.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70">
                {closedProjects.map(project => (
                    <ProjectItem 
                        key={project.id} 
                        projectId={project.id}
                        projectName={project.name} 
                        clientName={project.clientName} 
                        documents={project.documents} 
                        status={project.status} 
                    />
                ))}
            </div>
        </div>
    );
  };

  const DashboardContent = () => (
    // FIX: Main content area uses dynamic backgrounds
    <div className="p-6 space-y-6 flex-grow overflow-y-auto">
      
      {/* --- Section 1: Gamification & Stats --- */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">My Performance Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Catalyst Points" value={points} unit="pts" color="amber" onClick={() => setView('leaderboard')} />
        <StatCard title="Total Time Saved (Augmented)" value={tasks.filter(t => t.isComplete).length * 45} unit="minutes" color="green" />
        <StatCard 
          title="Badges Earned (S&O Certified)" 
          value={badges} 
          unit="badges" 
          color="yellow" 
          onClick={() => setView('certificates')} 
        />
      </div>

      {/* --- Section 2: Task Review and S&O Validator --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Details / S&O Validator Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2">
            Work Product Review: {selectedTask.name} 
          </h3>
          
          <div className="p-4 bg-amber-50 dark:bg-amber-900/50 rounded-lg">
            <p className="font-bold text-lg text-amber-800 dark:text-amber-200">AI Status:</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Draft completed. Consultant to perform **20% strategic review** and validate **S&O compliance** below.
            </p>
          </div>
          
          {/* AI Output / Structured Summary */}
          <div className="space-y-4">
             <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 border-l-4 border-amber-500 pl-3">AI Output (The Initial 80% Draft)</h4>
             
             <p className="text-sm italic text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600 whitespace-pre-wrap">
                {liveSummaryData.executive_summary}
             </p>
             
             {liveSummaryData.action_items.length > 0 && (
                <>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Action Items (Extracted & Structured):</h4>
                    <ul className="list-none p-0">
                        {liveSummaryData.action_items.map((item, index) => (
                            <ActionItemCard key={index} {...item} />
                        ))}
                    </ul>
                </>
             )}
              {liveSummaryData.potential_blockers.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded-md border border-yellow-300 dark:border-yellow-700">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Potential Blockers:</p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                        {liveSummaryData.potential_blockers.map((blocker, index) => (
                            <li key={index}>{blocker}</li>
                        ))}
                    </ul>
                </div>
              )}
          </div>

          {/* S&O Validator (Governance Gate) */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
             <h4 className="text-lg font-bold text-gray-900 dark:text-white">S&O Validator: Operational Health Check</h4>
             <p className="text-sm text-gray-600 dark:text-gray-300">
                **Final Governance Step:** After performing your 20% strategic review, validate compliance to finalize the task.
             </p>

             <div className={`p-4 rounded-lg font-semibold transition-colors ${
                 validationStatus.risk === 'pass' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                 validationStatus.risk === 'fail' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
             }`}>
                Current Status: {validationStatus.status}
             </div>

             {validationStatus.risk === 'fail' && (
                 <div className="mt-3 space-y-2">
                    {validationStatus.findings.map((finding, index) => (
                        <RiskFinding key={index} {...finding} />
                    ))}
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        Points Deducted: -50. Action: Task must be revised and resubmitted.
                    </p>
                    {/* AI REMEDIATION COACH BUTTON */}
                    <button 
                        onClick={handleCoachingRequest}
                        disabled={coachingLoading}
                        className="w-full px-4 py-2 mt-2 text-sm bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {coachingLoading ? (
                            'Generating Remediation Plan...'
                        ) : (
                            <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            <span>✨ Get AI Remediation Coach Plan</span>
                            </>
                        )}
                    </button>
                    {coachingResponse && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border-l-4 border-amber-500 text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                            <p className="font-bold text-amber-600 dark:text-amber-400">AI Remediation Plan:</p>
                            {coachingResponse}
                        </div>
                    )}
                 </div>
             )}

             <div className="flex space-x-4 mt-4">
                <button 
                   onClick={() => handleValidation(true)} 
                   disabled={isLoading || selectedTask.isComplete || validationStatus.risk === 'pass'}
                   className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 transition duration-300 disabled:opacity-50"
                >
                    {isLoading ? 'Processing...' : 'Simulate Compliance PASS (+150 pts)'}
                </button>
                <button 
                   onClick={() => handleValidation(false)} 
                   disabled={isLoading || selectedTask.isComplete || validationStatus.risk === 'pass'}
                   className="flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 disabled:opacity-50"
                >
                    Simulate MAJOR RISK Flag (-50 pts)
                </button>
             </div>
          </div>
        </div>
        
        {/* Learning Path & Live Test Panel */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Learning Path */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">
                    My Personalized AI Literacy Path
                </h3>
                <div className="space-y-3">
                    {learningModules.map((module, index) => (
                        <LearningProgress key={index} {...module} />
                    ))}
                </div>
                
                <h4 className="text-lg font-semibold text-amber-600 dark:text-amber-400 pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
                    ✨ Instant Knowledge Hub
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Need a quick brief? Get an executive summary on any topic.
                </p>
                <input
                    type="text"
                    ref={skillQueryRef}
                    placeholder="e.g., Explain Zero Trust Architecture"
                    // defaultValue="Zero Trust Architecture"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-amber-500 focus:border-amber-500"
                />
                 <button 
                    onClick={handleSkillGenerator}
                   disabled={skillLoading || (skillQueryRef.current && skillQueryRef.current.value.trim().length === 0)}
                    className="w-full mt-3 px-4 py-2 text-sm bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                >
                    {skillLoading ? 'Generating Summary...' : 'Get Executive Brief'}
                </button>
                 {skillResponse && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border-l-4 border-amber-500 text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                        <p className="font-bold text-amber-600 dark:text-amber-400">AI Executive Brief:</p>
                        {skillResponse}
                    </div>
                )}
            </div>
            
            {/* Instant Summary Generator (Phase 2 Demo) */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">
                    Instant Summary Generator
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Paste raw transcript
                </p>
                
                <textarea
                    ref={liveTranscriptRef}
                    rows="6"
                    placeholder="Paste raw/messy transcript here..."
                    // defaultValue={}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                    onClick={handleLiveSummarize}
                    disabled={isLoading || (liveTranscriptRef.current && liveTranscriptRef.current.value.trim().length === 0)}
                    className="mt-3 w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50"
                >
                    {isLoading ? 'Orchestrating Gemini API...' : 'Run Live Structured Summary'}
                </button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                   
                </p>
            </div>
        </div>
        
      </div>

    </div>
  );

  const renderContent = () => {
      switch (view) {
          case 'certificates':
              return <CertificatesView />;
          case 'leaderboard':
              return <LeaderboardView />;
          case 'projects':
              return <ProjectsView />;
          case 'dashboard':
          default:
              return <DashboardContent />;
      }
  };

  return (
    // <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
    <div className="min-h-screen flex flex-col">
      <style>{`
        body { font-family: 'Inter', sans-serif; }
        .dark .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2); }
        .font-serif { font-family: 'Times New Roman', Times, serif; } /* Fallback for Serif */
      `}</style>
      <Header />
     <div className="flex flex-1 overflow-hidden">
      {view === 'dashboard' && <Sidebar />}
      {/* Apply base background to the main scrollable content area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900"> 
        {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;