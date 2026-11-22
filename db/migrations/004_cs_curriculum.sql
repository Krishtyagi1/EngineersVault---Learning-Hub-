-- Undergraduate subjects based on ACM/IEEE-CS/AAAI CS2023 and the AICTE UG CSE model.
INSERT INTO disciplines(id,label,description,position) VALUES
  ('programming', 'Programming Fundamentals', 'Procedural programming, abstraction, testing, and debugging.', 10),
  ('oop', 'Object-Oriented Programming', 'Classes, interfaces, polymorphism, and design principles.', 11),
  ('dsa', 'Data Structures & Algorithms', 'Lists, trees, graphs, hashing, sorting, and searching.', 12),
  ('algorithm-design', 'Design & Analysis of Algorithms', 'Complexity analysis, greedy algorithms, dynamic programming, and reductions.', 13),
  ('discrete-math', 'Discrete Mathematics', 'Logic, proofs, sets, combinatorics, and graph theory.', 14),
  ('linear-algebra', 'Linear Algebra & Calculus', 'Vectors, matrices, transformations, derivatives, and optimization foundations.', 15),
  ('probability', 'Probability & Statistics', 'Random variables, distributions, estimation, inference, and simulation.', 16),
  ('digital-logic', 'Digital Logic Design', 'Boolean algebra, combinational circuits, sequential logic, and finite-state machines.', 17),
  ('architecture', 'Computer Organization & Architecture', 'Instruction sets, processors, pipelining, caches, and memory hierarchy.', 18),
  ('systems', 'Systems Fundamentals', 'Machine-level data, assembly, memory, linking, and systems programming.', 19),
  ('operating-systems', 'Operating Systems', 'Processes, scheduling, virtual memory, concurrency, and file systems.', 20),
  ('databases', 'Database Management Systems', 'SQL, relational modeling, normalization, indexes, transactions, and NoSQL.', 21),
  ('networks', 'Computer Networks', 'Layered protocols, routing, transport, and network applications.', 22),
  ('security', 'Cybersecurity & Cryptography', 'Threat models, secure design, access control, and cryptographic principles.', 23),
  ('languages', 'Programming Language Foundations', 'Types, semantics, interpreters, and functional and logic programming.', 24),
  ('compilers', 'Compiler Design', 'Lexing, parsing, semantic analysis, optimization, and code generation.', 25),
  ('computation-theory', 'Theory of Computation', 'Automata, formal languages, computability, and complexity classes.', 26),
  ('software-engineering', 'Software Engineering', 'Requirements, design, testing, maintenance, and team delivery.', 27),
  ('parallel-distributed', 'Parallel & Distributed Computing', 'Concurrency, synchronization, parallel algorithms, replication, and fault tolerance.', 28),
  ('graphics', 'Computer Graphics & Visualization', 'Rendering, geometry, animation, interactive techniques, and visual encoding.', 29),
  ('hci', 'Human–Computer Interaction', 'User research, interaction design, accessibility, prototyping, and evaluation.', 30),
  ('ethics', 'Computing Ethics & Society', 'Privacy, fairness, professional responsibility, and the social impact of computing.', 31),
  ('web-mobile', 'Web & Mobile Development', 'Web protocols, client and server applications, mobile platforms, and app design.', 32),
  ('embedded-iot', 'Embedded Systems & IoT', 'Microcontrollers, real-time computing, sensors, and connected devices.', 33),
  ('cloud', 'Cloud Computing & DevOps', 'Virtualization, containers, deployment, observability, and cloud service models.', 34);

-- Reclassify curated resources while retaining their IDs and moderation history.
UPDATE resources AS r
SET discipline_id = subject.new_id
FROM (VALUES
  ('Data Structures & Algorithms – Abdul Bari', 'cs', 'dsa'),
  ('MIT 6.006 – Introduction to Algorithms', 'cs', 'algorithm-design'),
  ('Operating Systems – Neso Academy', 'cs', 'operating-systems'),
  ('Computer Networks – Neso Academy', 'cs', 'networks'),
  ('Database Management Systems (NPTEL)', 'cs', 'databases'),
  ('Object Oriented Programming – Java', 'cs', 'oop'),
  ('Compiler Design (NPTEL)', 'cs', 'compilers'),
  ('Theory of Computation (NPTEL)', 'cs', 'computation-theory'),
  ('Cyber Security Full Course', 'net', 'security'),
  ('Computer Networks (NPTEL IIT Kharagpur)', 'net', 'networks'),
  ('Cryptography & Network Security', 'net', 'security'),
  ('Structure & Interpretation of Computer Programs', 'cs', 'languages'),
  ('Operating Systems: Three Easy Pieces', 'cs', 'operating-systems'),
  ('Computer Networks: A Systems Approach', 'cs', 'networks'),
  ('Think Python 2nd Edition', 'cs', 'programming')
) AS subject(title, old_id, new_id)
WHERE r.title = subject.title AND r.discipline_id = subject.old_id AND r.submitted_by IS NULL;
