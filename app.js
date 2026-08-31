/* ============================================================
   EngineersVault — app.js (Evolve Theme)
   GSAP + ScrollTrigger · Magnetic cursor · Accordion · Search
   ============================================================ */

// ============================================================
//  DATA
// ============================================================
const SUBJECTS = [
  { id:'cs',    num:'01', label:'Computer Science',        icon:'⌨',  color:'#1a1a1a', desc:'Algorithms · OS · Databases · Compilers · Theory' },
  { id:'ai',    num:'02', label:'AI & Machine Learning',   icon:'◎',  color:'#2d2d2d', desc:'Deep Learning · NLP · Computer Vision · Reinforcement Learning' },
  { id:'ds',    num:'03', label:'Data Science',            icon:'⬡',  color:'#3a3a3a', desc:'Python · Statistics · Big Data · Visualization' },
  { id:'net',   num:'04', label:'Networks & Security',     icon:'⬡',  color:'#1a1a1a', desc:'Cryptography · Cyber Security · Network Protocols' },
  { id:'elec',  num:'05', label:'Electrical Engineering',  icon:'⚡',  color:'#2d2d2d', desc:'Circuits · Signals · Power Systems · Control · Digital' },
  { id:'mech',  num:'06', label:'Mechanical Engineering',  icon:'⚙',  color:'#3a3a3a', desc:'Thermodynamics · Fluid Mechanics · Heat Transfer · SOM' },
  { id:'civil', num:'07', label:'Civil Engineering',       icon:'▲',  color:'#1a1a1a', desc:'Structural Analysis · Geotechnical · Transportation' },
  { id:'chem',  num:'08', label:'Chemical Engineering',    icon:'⬡',  color:'#2d2d2d', desc:'Reaction Engineering · Mass Transfer · Unit Operations' },
  { id:'math',  num:'09', label:'Engineering Mathematics', icon:'∑',  color:'#3a3a3a', desc:'Linear Algebra · Calculus · Differential Equations · Numerics' },
  { id:'bio',   num:'10', label:'Biomedical Engineering',  icon:'⊕',  color:'#1a1a1a', desc:'Biomechanics · Biosignals · Medical Imaging' },
];

const playlists = [
  // ── COMPUTER SCIENCE ──
  { title:"CS50 – Introduction to Computer Science", channel:"Harvard / David Malan", subject:"cs", videos:"24 videos",
    thumb:"https://img.youtube.com/vi/8mAITcNt710/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLhQjrBD2T381WAHyx1pq-sBfykqMBI7V4",
    topics:["C programming","Arrays & Pointers","Data Structures","Python","SQL","Web Basics"],
    tags:["Beginner","C","Python"], notes:{ label:'Course Notes', url:'https://cs50.harvard.edu/x/2024/notes/' } },
  { title:"Data Structures & Algorithms – Abdul Bari", channel:"Abdul Bari", subject:"cs", videos:"86 videos",
    thumb:"https://img.youtube.com/vi/0IAPZzGSbME/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O",
    topics:["Arrays","Linked Lists","Trees","Graphs","Sorting","Dynamic Programming"],
    tags:["DSA","Algorithms","Beginner-Friendly"] },
  { title:"MIT 6.006 – Introduction to Algorithms", channel:"MIT OpenCourseWare", subject:"cs", videos:"47 videos",
    thumb:"https://img.youtube.com/vi/HtSuA80QTyo/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLUl4u3cNGP61Oq3tWYp6V_F-5jb5L2iHb",
    topics:["Peak Finding","Sorting","Hashing","Graphs","Shortest Paths","Dynamic Programming"],
    tags:["Advanced","MIT"], notes:{ label:'MIT Lecture Notes', url:'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/' } },
  { title:"Operating Systems – Neso Academy", channel:"Neso Academy", subject:"cs", videos:"100 videos",
    thumb:"https://img.youtube.com/vi/vBURTt97EkA/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAeuVcp2O",
    topics:["Process Management","Scheduling","Memory Management","File Systems","I/O"],
    tags:["OS","Systems"] },
  { title:"Computer Networks – Neso Academy", channel:"Neso Academy", subject:"cs", videos:"90 videos",
    thumb:"https://img.youtube.com/vi/JFF2vJaN0Cw/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx",
    topics:["OSI Model","TCP/IP","Routing","HTTP & DNS","Network Security"],
    tags:["Networks","TCP/IP"] },
  { title:"Database Management Systems (NPTEL)", channel:"NPTEL IIT Madras", subject:"cs", videos:"38 videos",
    thumb:"https://img.youtube.com/vi/kBdlM6hNDAE/hqdefault.jpg", url:"https://nptel.ac.in/courses/106/106/106106093/",
    topics:["ER Diagrams","Relational Algebra","SQL","Normalization","Transactions"],
    tags:["DBMS","SQL"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/106/106/106106093/' } },
  { title:"Object Oriented Programming – Java", channel:"Telusko", subject:"cs", videos:"85 videos",
    thumb:"https://img.youtube.com/vi/BSVKUk58K6U/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLsyeobzWxl7pe_IiTfNyr55kwJPWbgxB5",
    topics:["Classes & Objects","Inheritance","Polymorphism","Interfaces","Design Patterns"],
    tags:["OOP","Java"] },
  { title:"Compiler Design (NPTEL)", channel:"NPTEL", subject:"cs", videos:"36 videos",
    thumb:"https://img.youtube.com/vi/Qkwj65l_96I/hqdefault.jpg", url:"https://nptel.ac.in/courses/106/105/106105121/",
    topics:["Lexical Analysis","Parsing","Syntax Trees","Semantic Analysis","Code Generation"],
    tags:["Compilers","Theory"] },
  { title:"Theory of Computation (NPTEL)", channel:"NPTEL IIT Kanpur", subject:"cs", videos:"40 videos",
    thumb:"https://img.youtube.com/vi/eqCkkC9A0Q4/hqdefault.jpg", url:"https://nptel.ac.in/courses/106/104/106104028/",
    topics:["Finite Automata","Regular Languages","Context-Free Grammars","Turing Machines","NP-Completeness"],
    tags:["TOC","Automata"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/106/104/106104028/' } },

  // ── AI & ML ──
  { title:"Stanford CS229 – Machine Learning", channel:"Stanford University", subject:"ai", videos:"20 videos",
    thumb:"https://img.youtube.com/vi/jGwO_UgTS7I/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU",
    topics:["Linear Regression","Logistic Regression","Neural Networks","SVMs","Unsupervised Learning"],
    tags:["ML","Stanford","Andrew Ng"], notes:{ label:'Stanford Notes PDF', url:'https://cs229.stanford.edu/lectures-spring2022/main_notes.pdf' } },
  { title:"Deep Learning Specialization", channel:"DeepLearning.AI", subject:"ai", videos:"30 videos",
    thumb:"https://img.youtube.com/vi/CS4cs9xVecg/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLkDaE6sCZn6Ec-XTbcX1uRg2_u4xOEky0",
    topics:["Neural Nets","CNNs","RNNs","Optimization","Hyperparameter Tuning"],
    tags:["Deep Learning","Neural Networks"] },
  { title:"Stanford CS224N – NLP", channel:"Stanford NLP", subject:"ai", videos:"22 videos",
    thumb:"https://img.youtube.com/vi/rmVRLeJRkl4/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLoROMvodv4rOSH4v6133s9LFPRHjEmbmJ",
    topics:["Word Embeddings","RNNs & LSTMs","Transformers","BERT","Attention Mechanism"],
    tags:["NLP","Transformers","LLM"], notes:{ label:'Stanford Slides', url:'https://web.stanford.edu/class/cs224n/' } },
  { title:"Reinforcement Learning (David Silver)", channel:"DeepMind / UCL", subject:"ai", videos:"10 videos",
    thumb:"https://img.youtube.com/vi/2pWv7GOvuf0/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLqYmG7hTraZDM-OYHWgPebj2MfCFzFObQ",
    topics:["MDPs","Q-Learning","Policy Gradient","Actor-Critic","AlphaGo"],
    tags:["RL","DeepMind"], notes:{ label:'David Silver Slides', url:'https://www.davidsilver.uk/teaching/' } },
  { title:"Computer Vision – Stanford CS231N", channel:"Stanford Vision Lab", subject:"ai", videos:"18 videos",
    thumb:"https://img.youtube.com/vi/vT1JzLTH4G4/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv",
    topics:["Image Classification","CNNs","Object Detection","Segmentation","GANs"],
    tags:["CV","CNNs","Stanford"], notes:{ label:'CS231N Notes', url:'https://cs231n.github.io/' } },
  { title:"Artificial Intelligence – MIT 6.034", channel:"MIT OpenCourseWare", subject:"ai", videos:"30 videos",
    thumb:"https://img.youtube.com/vi/TjZBTDzGeGg/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLUl4u3cNGP63gFHB6xb-kVBiQHYe_4hSi",
    topics:["Search","Constraint Satisfaction","Logic","Planning","Probabilistic Inference"],
    tags:["AI","MIT"], notes:{ label:'MIT Lecture Notes', url:'https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/pages/lecture-notes/' } },

  // ── DATA SCIENCE ──
  { title:"Data Science with Python – Full Course", channel:"freeCodeCamp", subject:"ds", videos:"1 long video",
    thumb:"https://img.youtube.com/vi/LHBE6Q9XlzI/hqdefault.jpg", url:"https://www.youtube.com/watch?v=LHBE6Q9XlzI",
    topics:["NumPy & Pandas","Matplotlib","Data Cleaning","EDA","Feature Engineering"],
    tags:["Python","Data Science"] },
  { title:"Statistics for Data Science (NPTEL)", channel:"NPTEL IIT", subject:"ds", videos:"35 videos",
    thumb:"https://img.youtube.com/vi/zRUliXuwJCQ/hqdefault.jpg", url:"https://nptel.ac.in/courses/111/105/111105041/",
    topics:["Probability","Distributions","Hypothesis Testing","Regression","Bayesian Stats"],
    tags:["Statistics","Probability"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/111/105/111105041/' } },
  { title:"Big Data Analytics (NPTEL)", channel:"NPTEL IIT Madras", subject:"ds", videos:"40 videos",
    thumb:"https://img.youtube.com/vi/RO_mZnwSCLo/hqdefault.jpg", url:"https://nptel.ac.in/courses/106/106/106106097/",
    topics:["Hadoop","MapReduce","Spark","NoSQL","Data Warehousing"],
    tags:["Big Data","Hadoop","Spark"] },

  // ── NETWORKS & SECURITY ──
  { title:"Cyber Security Full Course", channel:"Simplilearn", subject:"net", videos:"10 hours",
    thumb:"https://img.youtube.com/vi/z5nc9MDbvkw/hqdefault.jpg", url:"https://www.youtube.com/watch?v=z5nc9MDbvkw",
    topics:["Ethical Hacking","Cryptography","Firewalls","Penetration Testing","Security Protocols"],
    tags:["CyberSecurity","Hacking"] },
  { title:"Computer Networks (NPTEL IIT Kharagpur)", channel:"NPTEL", subject:"net", videos:"58 videos",
    thumb:"https://img.youtube.com/vi/IkVM8oFG4Ak/hqdefault.jpg", url:"https://nptel.ac.in/courses/106/105/106105081/",
    topics:["Network Layer","Transport Layer","Application Layer","Wireless Networks","Security"],
    tags:["NPTEL","Networks"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/106/105/106105081/' } },
  { title:"Cryptography & Network Security", channel:"NPTEL IIT Kharagpur", subject:"net", videos:"38 videos",
    thumb:"https://img.youtube.com/vi/t-rOT6BcEyk/hqdefault.jpg", url:"https://nptel.ac.in/courses/106/105/106105031/",
    topics:["Symmetric Encryption","Public Key Crypto","Digital Signatures","SSL/TLS","PKI"],
    tags:["Cryptography","Security"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/106/105/106105031/' } },

  // ── ELECTRICAL ──
  { title:"Circuits & Electronics – MIT 6.002", channel:"MIT OpenCourseWare", subject:"elec", videos:"25 videos",
    thumb:"https://img.youtube.com/vi/AfQxyVuLeCs/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLUl4u3cNGP61kdPAOC7CzFjJZ8f1eMUxs",
    topics:["KVL/KCL","Op-Amps","Filters","Diodes","Transistors"],
    tags:["Circuits","MIT"], notes:{ label:'MIT Lecture Notes', url:'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/lecture-notes/' } },
  { title:"Signals and Systems (NPTEL)", channel:"NPTEL IIT Bombay", subject:"elec", videos:"40 videos",
    thumb:"https://img.youtube.com/vi/s8rsR_TStaA/hqdefault.jpg", url:"https://nptel.ac.in/courses/117/101/117101056/",
    topics:["Fourier Series","Laplace Transform","Z-Transform","Convolution","Frequency Response"],
    tags:["Signals","DSP"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/117/101/117101056/' } },
  { title:"Power Systems (NPTEL)", channel:"NPTEL IIT Kharagpur", subject:"elec", videos:"45 videos",
    thumb:"https://img.youtube.com/vi/pPHKSd5RVvk/hqdefault.jpg", url:"https://nptel.ac.in/courses/108/106/108106071/",
    topics:["Power Flow","Fault Analysis","Protection","Stability","HVDC"],
    tags:["Power Systems"] },
  { title:"Digital Electronics – Neso Academy", channel:"Neso Academy", subject:"elec", videos:"110 videos",
    thumb:"https://img.youtube.com/vi/M0mx8S05v60/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm",
    topics:["Boolean Algebra","Logic Gates","Flip-Flops","Counters","PLDs"],
    tags:["Digital","Logic Design"] },
  { title:"Control Systems – Brian Douglas", channel:"Brian Douglas", subject:"elec", videos:"55 videos",
    thumb:"https://img.youtube.com/vi/oBc_BHxw78s/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLUMWjy5jgHK3j74Z5Yn2Q-rdmCmQDptCD",
    topics:["Transfer Functions","PID Control","Bode Plots","Root Locus","State Space"],
    tags:["Control","PID"] },

  // ── MECHANICAL ──
  { title:"Engineering Thermodynamics (NPTEL)", channel:"NPTEL IIT Madras", subject:"mech", videos:"48 videos",
    thumb:"https://img.youtube.com/vi/vLHoQ9GjAOQ/hqdefault.jpg", url:"https://nptel.ac.in/courses/112/106/112106134/",
    topics:["Laws of Thermodynamics","Entropy","Carnot Cycle","Gas Turbines","Refrigeration"],
    tags:["Thermodynamics","NPTEL"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/112/106/112106134/' } },
  { title:"Strength of Materials – Michel van Biezen", channel:"Michel van Biezen", subject:"mech", videos:"60 videos",
    thumb:"https://img.youtube.com/vi/E7HcNFJEBzk/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLX2gX-ftPVXWjJbx24bDlNz3iFm-KQRRY",
    topics:["Stress & Strain","Bending Moments","Shear Force","Deflection","Buckling"],
    tags:["Strength of Materials","Mechanics"] },
  { title:"Fluid Mechanics (NPTEL IIT Bombay)", channel:"NPTEL", subject:"mech", videos:"42 videos",
    thumb:"https://img.youtube.com/vi/HcmA_tnfxJg/hqdefault.jpg", url:"https://nptel.ac.in/courses/112/105/112105171/",
    topics:["Bernoulli Equation","Viscosity","Pipe Flow","Boundary Layers","Turbulence"],
    tags:["Fluid Mechanics"] },
  { title:"Heat Transfer (NPTEL)", channel:"NPTEL IIT Bombay", subject:"mech", videos:"41 videos",
    thumb:"https://img.youtube.com/vi/3MnAz1MH2YQ/hqdefault.jpg", url:"https://nptel.ac.in/courses/112/101/112101097/",
    topics:["Conduction","Convection","Radiation","Heat Exchangers","Phase Change"],
    tags:["Heat Transfer"] },

  // ── CIVIL ──
  { title:"Structural Analysis (NPTEL)", channel:"NPTEL IIT Kharagpur", subject:"civil", videos:"40 videos",
    thumb:"https://img.youtube.com/vi/wfmcSFCZvnM/hqdefault.jpg", url:"https://nptel.ac.in/courses/105/105/105105041/",
    topics:["Trusses","Beams","Frames","Virtual Work","Matrix Methods"],
    tags:["Structural Analysis","Civil"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/105/105/105105041/' } },
  { title:"Geotechnical Engineering (NPTEL)", channel:"NPTEL IIT Kharagpur", subject:"civil", videos:"39 videos",
    thumb:"https://img.youtube.com/vi/FiJHPlFTjJo/hqdefault.jpg", url:"https://nptel.ac.in/courses/105/105/105105041/",
    topics:["Soil Classification","Compaction","Shear Strength","Foundation Design","Consolidation"],
    tags:["Geotechnical","Soil Mechanics"] },
  { title:"Transportation Engineering (NPTEL)", channel:"NPTEL", subject:"civil", videos:"36 videos",
    thumb:"https://img.youtube.com/vi/zS8yE2T3AaQ/hqdefault.jpg", url:"https://nptel.ac.in/courses/105/105/105105175/",
    topics:["Highway Design","Traffic Flow","Pavement Design","Railway Engineering","Airport Design"],
    tags:["Transportation","Highway"] },

  // ── CHEMICAL ──
  { title:"Chemical Reaction Engineering (NPTEL)", channel:"NPTEL IIT Madras", subject:"chem", videos:"40 videos",
    thumb:"https://img.youtube.com/vi/FQK3wOExoGc/hqdefault.jpg", url:"https://nptel.ac.in/courses/103/106/103106101/",
    topics:["Reaction Kinetics","Reactor Design","CSTR","PFR","Non-Ideal Reactors"],
    tags:["Chemical Reaction","Reactors"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/103/106/103106101/' } },
  { title:"Mass Transfer Operations (NPTEL)", channel:"NPTEL", subject:"chem", videos:"38 videos",
    thumb:"https://img.youtube.com/vi/9c7TIUU7FNY/hqdefault.jpg", url:"https://nptel.ac.in/courses/103/105/103105011/",
    topics:["Distillation","Absorption","Extraction","Drying","Evaporation"],
    tags:["Mass Transfer","Unit Ops"] },

  // ── MATH ──
  { title:"Linear Algebra – MIT 18.06 (Gilbert Strang)", channel:"MIT OpenCourseWare", subject:"math", videos:"34 videos",
    thumb:"https://img.youtube.com/vi/ZK3O402wf1c/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PL49CF3715CB9EF31D",
    topics:["Vector Spaces","Matrices","Eigenvalues","SVD","Determinants"],
    tags:["Linear Algebra","MIT"], notes:{ label:'MIT Course Readings', url:'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/pages/readings/' } },
  { title:"Calculus – MIT 18.01SC", channel:"MIT OpenCourseWare", subject:"math", videos:"56 videos",
    thumb:"https://img.youtube.com/vi/7K1sB05pE0A/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PL590CCC2BC5AF3BC1",
    topics:["Derivatives","Integrals","Series","Multivariable Calculus","Applications"],
    tags:["Calculus","MIT"], notes:{ label:'MIT Lecture Notes', url:'https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/pages/lecture-notes/' } },
  { title:"Numerical Methods (NPTEL)", channel:"NPTEL IIT", subject:"math", videos:"40 videos",
    thumb:"https://img.youtube.com/vi/9A_GhBuhGZ0/hqdefault.jpg", url:"https://nptel.ac.in/courses/111/104/111104114/",
    topics:["Root Finding","Interpolation","Numerical Integration","ODE Solvers","Matrix Methods"],
    tags:["Numerical Methods"] },
  { title:"Differential Equations – MIT 18.03", channel:"MIT OpenCourseWare", subject:"math", videos:"33 videos",
    thumb:"https://img.youtube.com/vi/76WdBlGpxVw/hqdefault.jpg", url:"https://www.youtube.com/playlist?list=PLEC88901EBADDD980",
    topics:["1st Order ODEs","2nd Order ODEs","Laplace Transform","Systems","Fourier Series"],
    tags:["Differential Equations","ODEs"], notes:{ label:'MIT Lecture Notes', url:'https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/pages/lecture-notes/' } },

  // ── BIOMEDICAL ──
  { title:"Biomedical Engineering Intro (MIT)", channel:"MIT OpenCourseWare", subject:"bio", videos:"30 videos",
    thumb:"https://img.youtube.com/vi/ZM-jqkRbGDs/hqdefault.jpg", url:"https://ocw.mit.edu/courses/20-010j-introduction-to-bioengineering-be-010j-spring-2006/",
    topics:["Biomechanics","Bioinstrumentation","Biomaterials","Biosignals","Medical Imaging"],
    tags:["Biomedical","MIT"] },
  { title:"Biomechanics (NPTEL)", channel:"NPTEL IIT", subject:"bio", videos:"35 videos",
    thumb:"https://img.youtube.com/vi/Pb1TZwT7UaU/hqdefault.jpg", url:"https://nptel.ac.in/courses/102/102/102102085/",
    topics:["Musculoskeletal Mechanics","Gait Analysis","Implant Design","Joint Mechanics","Tissue Mechanics"],
    tags:["Biomechanics","Medical"], notes:{ label:'NPTEL Notes', url:'https://nptel.ac.in/courses/102/102/102102085/' } },
];

const books = [
  { title:"Structure & Interpretation of Computer Programs", author:"Abelson & Sussman (MIT)", subject:"cs", icon:"💻", url:"https://web.mit.edu/6.001/6.037/sicp.pdf" },
  { title:"Operating Systems: Three Easy Pieces", author:"Arpaci-Dusseau (Wisconsin)", subject:"cs", icon:"🖥️", url:"https://pages.cs.wisc.edu/~remzi/OSTEP/" },
  { title:"Computer Networks: A Systems Approach", author:"Peterson & Davie", subject:"cs", icon:"🌐", url:"https://book.systemsapproach.org/" },
  { title:"Think Python 2nd Edition", author:"Allen Downey", subject:"cs", icon:"🐍", url:"https://greenteapress.com/wp/think-python-2e/" },
  { title:"Deep Learning", author:"Goodfellow, Bengio & Courville", subject:"ai", icon:"🧠", url:"https://www.deeplearningbook.org/" },
  { title:"Mathematics for Machine Learning", author:"Deisenroth, Faisal & Ong", subject:"ai", icon:"📐", url:"https://mml-book.github.io/" },
  { title:"Reinforcement Learning: An Introduction", author:"Sutton & Barto", subject:"ai", icon:"🤖", url:"http://incompleteideas.net/book/the-book-2nd.html" },
  { title:"Understanding Machine Learning", author:"Shai Shalev-Shwartz", subject:"ai", icon:"📊", url:"https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/" },
  { title:"Python Data Science Handbook", author:"Jake VanderPlas (O'Reilly)", subject:"ds", icon:"📈", url:"https://jakevdp.github.io/PythonDataScienceHandbook/" },
  { title:"An Introduction to Statistical Learning", author:"James, Witten, Hastie", subject:"ds", icon:"📉", url:"https://www.statlearning.com/" },
  { title:"Fundamentals of Electrical Engineering", author:"Richard Johnson (Rice Univ.)", subject:"elec", icon:"⚡", url:"https://www.ece.rice.edu/~dhj/courses/elec241/col10040.pdf" },
  { title:"Electromagnetics Vol. 1", author:"Steven Ellingson (VT)", subject:"elec", icon:"🧲", url:"https://doi.org/10.21061/electromagnetics-vol-1" },
  { title:"Linear Algebra Done Right", author:"Sheldon Axler", subject:"math", icon:"📐", url:"https://linear.axler.net/" },
  { title:"Applied Numerical Methods for Engineers", author:"LibreTexts Consortium", subject:"math", icon:"🔢", url:"https://math.libretexts.org/Bookshelves/Applied_Mathematics" },
  { title:"Fluid Mechanics (LibreTexts)", author:"LibreTexts Engineering", subject:"mech", icon:"💧", url:"https://eng.libretexts.org/Bookshelves/Fluid_Mechanics" },
  { title:"Introduction to Chemical Engineering", author:"LibreTexts Consortium", subject:"chem", icon:"🧪", url:"https://eng.libretexts.org/Bookshelves/Chemical_Engineering" },
  { title:"Engineering Mechanics: Statics", author:"OpenStax", subject:"civil", icon:"🏗️", url:"https://openstax.org/details/books/university-physics-volume-1" },
  { title:"Bioelectromagnetism", author:"Malmivuo & Plonsey", subject:"bio", icon:"🫀", url:"https://www.bem.fi/book/" },
];

// ============================================================
//  LOADER
// ============================================================
(function(){
  const count = document.getElementById('loaderCount');
  const progress = document.getElementById('loaderProgress');
  const loader = document.getElementById('loader');
  let n = 0;
  const interval = setInterval(() => {
    n += Math.floor(Math.random() * 8) + 3;
    if(n >= 100) n = 100;
    const display = String(n).padStart(2,'0');
    if(count) count.textContent = display;
    if(progress) progress.style.width = n + '%';
    if(n === 100) {
      clearInterval(interval);
      setTimeout(() => {
        if(loader) loader.classList.add('done');
        initAnimations();
      }, 400);
    }
  }, 40);
})();

// ============================================================
//  CURSOR — Magnetic, smooth, state-driven
// ============================================================
const dot = document.getElementById('cursor-dot');
const circle = document.getElementById('cursor-circle');
let mouseX = 0, mouseY = 0, circleX = 0, circleY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if(dot) { dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px'; }
});

(function animCircle() {
  circleX += (mouseX - circleX) * 0.1;
  circleY += (mouseY - circleY) * 0.1;
  if(circle) { circle.style.left = circleX + 'px'; circle.style.top = circleY + 'px'; }
  requestAnimationFrame(animCircle);
})();

// Cursor states
document.addEventListener('mouseover', e => {
  if(e.target.closest('.playlist-card')) document.body.classList.add('cursor-on-card');
  else if(e.target.closest('a,button,.filter-btn')) document.body.classList.add('cursor-on-link');
});
document.addEventListener('mouseout', e => {
  if(e.target.closest('.playlist-card')) document.body.classList.remove('cursor-on-card');
  else if(e.target.closest('a,button,.filter-btn')) document.body.classList.remove('cursor-on-link');
});

// ============================================================
//  MENU TOGGLE
// ============================================================
const menuToggle = document.getElementById('menuToggle');
const navOverlay = document.getElementById('navOverlay');
const header = document.getElementById('header');
let menuOpen = false;

if(menuToggle) menuToggle.addEventListener('click', () => {
  menuOpen = !menuOpen;
  navOverlay.classList.toggle('open', menuOpen);
  header.classList.toggle('menu-open', menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
});

// Close on nav link click
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    navOverlay.classList.remove('open');
    header.classList.remove('menu-open');
    document.body.style.overflow = '';
  });
});

// ============================================================
//  HERO ANIMATIONS (GSAP)
// ============================================================
function initAnimations() {
  if(typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero headline stagger reveal
  gsap.to('.headline-word', {
    y: '0%',
    duration: 1.2,
    ease: 'power4.out',
    stagger: 0.12,
    delay: 0.1,
  });

  // Hero bottom fade
  gsap.from('.hero-eyebrow, .hero-desc, .hero-cta, .hero-scroll', {
    opacity: 0, y: 20,
    duration: 1, ease: 'power3.out',
    stagger: 0.1, delay: 0.6,
  });

  // Stats counter
  const statsObs = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting) {
      document.querySelectorAll('.stat-num').forEach(el => {
        const target = +el.dataset.target;
        let current = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.round(current);
          if(current >= target) clearInterval(timer);
        }, 25);
      });
      statsObs.disconnect();
    }
  }, { threshold: 0.3 });
  const statsBar = document.querySelector('.stats-bar');
  if(statsBar) statsObs.observe(statsBar);

  // Scroll-triggered subject rows
  gsap.utils.toArray('.subject-row').forEach((row, i) => {
    gsap.from(row, {
      scrollTrigger: { trigger: row, start: 'top 90%', toggleActions: 'play none none none' },
      opacity: 0, y: 30,
      duration: 0.7, ease: 'power3.out', delay: i * 0.04,
    });
  });

  // Scroll-triggered cards
  ScrollTrigger.batch('.playlist-card', {
    onEnter: batch => gsap.from(batch, {
      opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.07,
    }),
    start: 'top 92%',
  });
}

// ============================================================
//  MAGNETIC BUTTONS
// ============================================================
document.querySelectorAll('[data-magnetic]').forEach(el => {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});

// ============================================================
//  BUILD SECTIONS (Accordion rows)
// ============================================================
function buildSections() {
  const list = document.getElementById('subjectsList');
  if(!list) return;
  list.innerHTML = '';

  SUBJECTS.forEach((subj, si) => {
    const sPlaylists = playlists.filter(p => p.subject === subj.id);
    const sBooks = books.filter(b => b.subject === subj.id);
    if(!sPlaylists.length && !sBooks.length) return;

    const row = document.createElement('div');
    row.className = 'subject-row';
    row.id = 'sec-' + subj.id;
    row.dataset.subj = subj.id;
    row.style.setProperty('--subj-col', subj.color);

    row.innerHTML = `
      <div class="subject-row-header" onclick="toggleSubject('${subj.id}')">
        <div class="subj-index">(${subj.num})</div>
        <div class="subj-name-wrap">
          <h2 class="subj-name">${subj.label}</h2>
          <div class="subj-desc">${subj.desc}</div>
        </div>
        <div class="subj-right">
          <div class="subj-meta">
            <div class="subj-meta-item">
              <span class="subj-meta-num">${sPlaylists.length}</span>
              <span>Playlists</span>
            </div>
            ${sBooks.length ? `<div class="subj-meta-item"><span class="subj-meta-num">${sBooks.length}</span><span>Books</span></div>` : ''}
          </div>
          <div class="subj-toggle" id="toggle-${subj.id}">+</div>
        </div>
      </div>
      <div class="subject-body" id="body-${subj.id}">
        <div class="subject-body-inner">
          <div class="row-label"><span>▶</span> Video Playlists</div>
          <div class="playlists-grid" id="grid-pl-${subj.id}"></div>
          <div class="no-results hidden" id="no-pl-${subj.id}">
            <span class="no-results-icon">⌕</span>No playlists match your search.
          </div>
          ${sBooks.length ? `
          <div class="row-label" style="margin-top:2.5rem"><span>📚</span> Free Books & Open Textbooks</div>
          <div class="books-row" id="grid-bk-${subj.id}"></div>` : ''}
        </div>
      </div>`;

    list.appendChild(row);
    renderPlaylists(subj.id, sPlaylists);
    if(sBooks.length) renderBooks(subj.id, sBooks);
  });
}

function renderPlaylists(subjId, data) {
  const grid = document.getElementById('grid-pl-' + subjId);
  if(!grid) return;
  grid.innerHTML = '';
  data.forEach(p => {
    const div = document.createElement('div');
    div.className = 'playlist-card';
    div.dataset.subj = subjId;
    div.dataset.search = (p.title + p.channel + p.tags.join(' ') + p.topics.join(' ')).toLowerCase();
    div.innerHTML = `
      <div class="card-thumb">
        <div class="card-color-strip"></div>
        <img src="${p.thumb}" alt="${p.title}" loading="lazy" onerror="this.src='https://placehold.co/480x270/e8e4de/8c8880?text=▶'">
        <div class="card-thumb-play">▶</div>
      </div>
      <div class="card-body">
        <div class="card-meta">${p.channel} · ${p.videos}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-tags">${p.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}</div>
        <div class="card-actions">
          <a href="${p.url}" target="_blank" class="card-btn card-btn-primary">Open ↗</a>
          <button class="card-btn card-btn-ghost" onclick="toggleExpand(this)">Topics +</button>
          ${p.notes ? `<a href="${p.notes.url}" target="_blank" class="card-btn card-btn-notes" title="${p.notes.label}">📝 Notes</a>` : ''}
        </div>
      </div>
      <div class="card-expand">
        <div class="card-expand-inner">
          <div class="expand-title">Topics Covered</div>
          <div class="expand-topics">${p.topics.map(t => `<div class="expand-topic">${t}</div>`).join('')}</div>
          ${p.notes ? `<a href="${p.notes.url}" target="_blank" class="expand-notes-link">📝 ${p.notes.label} →</a>` : ''}
        </div>
      </div>`;
    grid.appendChild(div);
  });
}

function renderBooks(subjId, data) {
  const grid = document.getElementById('grid-bk-' + subjId);
  if(!grid) return;
  grid.innerHTML = '';
  data.forEach(b => {
    const div = document.createElement('div');
    div.className = 'book-mini';
    div.innerHTML = `
      <div class="book-mini-icon">${b.icon}</div>
      <div class="book-mini-info">
        <div class="book-mini-title">${b.title}</div>
        <div class="book-mini-author">${b.author}</div>
      </div>
      <a href="${b.url}" target="_blank" class="book-mini-link">Read ↗</a>`;
    grid.appendChild(div);
  });
}

// ============================================================
//  ACCORDION TOGGLE
// ============================================================
function toggleSubject(id) {
  const row = document.getElementById('sec-' + id);
  const toggle = document.getElementById('toggle-' + id);
  const isOpen = row.classList.contains('open');
  row.classList.toggle('open', !isOpen);
  if(toggle) toggle.textContent = isOpen ? '+' : '−';
}

// ============================================================
//  FILTER & SEARCH
// ============================================================
let searchTerm = '';
let activeFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    applyFilters();
    if(activeFilter !== 'all') {
      const target = document.getElementById('sec-' + activeFilter);
      if(target) {
        // Auto-open the section
        const row = target;
        if(!row.classList.contains('open')) toggleSubject(activeFilter);
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  });
});

let searchTimer;
document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTerm = e.target.value.trim().toLowerCase();
    applyFilters();
  }, 200);
});

function applyFilters() {
  let totalVisible = 0;

  document.querySelectorAll('.subject-row').forEach(sec => {
    const subjId = sec.dataset.subj;

    // Discipline filter
    const matchDiscipline = activeFilter === 'all' || subjId === activeFilter;
    if(!matchDiscipline) { sec.style.display = 'none'; return; }
    sec.style.display = '';

    // Card-level search
    const cards = sec.querySelectorAll('.playlist-card');
    let visibleInSection = 0;
    cards.forEach(card => {
      const match = !searchTerm || card.dataset.search.includes(searchTerm);
      card.style.display = match ? '' : 'none';
      if(match) visibleInSection++;
    });
    totalVisible += visibleInSection;

    const noPl = sec.querySelector('.no-results');
    if(noPl) {
      noPl.classList.toggle('hidden', visibleInSection > 0 || !searchTerm);
      noPl.classList.toggle('visible-block', visibleInSection === 0 && !!searchTerm);
    }
    if(searchTerm) sec.style.display = visibleInSection > 0 ? '' : 'none';
  });

  const rc = document.getElementById('resultsCount');
  if(rc) rc.textContent = searchTerm ? `${totalVisible} result${totalVisible !== 1 ? 's' : ''} for "${searchTerm}"` : '';
}

// ============================================================
//  EXPAND / COLLAPSE TOPICS
// ============================================================
function toggleExpand(btn) {
  const panel = btn.closest('.playlist-card').querySelector('.card-expand');
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open');
  btn.textContent = isOpen ? 'Topics +' : 'Topics −';
}

// ============================================================
//  INIT
// ============================================================
buildSections();
