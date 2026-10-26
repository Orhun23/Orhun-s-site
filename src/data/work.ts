// Checked against CV + LinkedIn by Orhun. LinkedIn says Vanderlande is "Present" — it isn't.

export type Role = {
  id: string;
  title: string;
  org: string;
  place: string;
  from: string;
  to: string;
  summary: string; // one line for the homepage teaser
  details: string[]; // the expanded row on /work
  stack: string[];
};

export const roles: Role[] = [
  {
    id: 'vi-controls',
    title: 'International Controls Project Engineer',
    org: 'Vanderlande',
    place: 'Veghel · on site in UK + India',
    from: 'Sep 2025',
    to: 'Sep 2026',
    summary: 'Commissioned loop-sorter control systems on customer sites abroad.',
    details: [
      'Brought loop-sorter control systems to life on customer sites in the UK and India, in teams of 2–4.',
      'PLCs over Profinet plus FSC safety, and Vanderlande’s Debian-based flow controller.',
      'Bring-up, verification against spec, on-site fault finding, all the way to customer handover.',
      'Longest stint: six months on an XXL loop sorter in the UK, 800+ destinations.',
    ],
    stack: ['PLC', 'Profinet', 'FSC', 'Linux', 'Commissioning'],
  },
  {
    id: 'vi-graduation',
    title: 'Graduation Intern Mechatronics',
    org: 'Vanderlande',
    place: 'Veghel',
    from: 'Feb 2025',
    to: 'Sep 2025',
    summary: 'Could a new Siemens platform replace the classic PLC architecture? Tested it.',
    details: [
      'Feasibility study on replacing the traditional PLC control architecture with a Siemens platform that unifies control types, compared against vendor-independent options.',
      'Looked at what moving control from OT hardware onto IT infrastructure (Docker containers) does to deterministic behaviour.',
      'Built the evaluation platform myself in IEC 61131-3 ST and ran the validation test plan.',
    ],
    stack: ['IEC 61131-3 ST', 'TIA Portal', 'Docker', 'Determinism testing'],
  },
  {
    id: 'wefabricate',
    title: 'Mechatronics Intern',
    org: 'WeFabricate',
    place: 'Best',
    from: 'Feb 2024',
    to: 'Jul 2024',
    summary: 'Rewrote an AGV-fed bin station’s control software in C++, plus a digital twin.',
    details: [
      'Rewrote the Bin-Handler (AGV-fed bin registration station) control software in C++, re-architected so it scales.',
      'ROS2 for modular comms, a C++ behaviour tree with custom Groot nodes.',
      'Built a Gazebo digital twin from a URDF covering its full range of motion.',
    ],
    stack: ['C++', 'ROS2', 'Behaviour trees', 'Gazebo', 'URDF'],
  },
  {
    id: 'fyllar',
    title: 'Mechatronic Engineer (part-time)',
    org: 'Fyllar',
    place: 'Best',
    from: 'May 2023',
    to: 'Jul 2024',
    summary: 'Wrote a BLDC gate-driver library from the register map. It shipped.',
    details: [
      'Low-level C++ driver library for the MCF8329A three-phase BLDC FOC gate driver over I²C, written straight from the register map.',
      'It shipped in Fyllar’s dispensing machine.',
      'Also a C# proof of concept for automated unit testing.',
    ],
    stack: ['C++', 'I²C', 'BLDC / FOC', 'C#'],
  },
  {
    id: 'teampi',
    title: 'Software Engineer',
    org: 'Robotics Team Pi',
    place: 'Eindhoven',
    from: 'Jul 2022',
    to: 'Aug 2023',
    summary: 'One of two software engineers on a competition robot. Took 3rd.',
    details: [
      'One of two software engineers. Designed the full software architecture for the PHINIX robot, including sensor comms.',
      'Object detection in Python + OpenCV with a depth camera.',
      'Third place at the regional competition.',
    ],
    stack: ['Python', 'OpenCV', 'Depth camera', 'Architecture'],
  },
];

export const education = {
  degree: 'BSc Mechatronics Engineering',
  school: 'Fontys University of Applied Sciences',
  years: '2021–2025',
  note: 'Specialisation Project Management & Automation. Final grade 8/10.',
};

export const skills = [
  'C++',
  'ROS2',
  'Python',
  'C#',
  'Linux',
  'Git',
  'PLC programming',
  'TIA Portal',
  'IEC 61131-3 ST',
  'Profinet',
  'Gazebo',
  'Matlab',
  'SolidWorks',
  'Fusion 360',
  '3D printing',
];

export const certificates = ['SolidWorks CSWA (2021)', 'VCA-VOL (on-site safety)'];

export const languages = [
  { name: 'Dutch', level: 'Native' },
  { name: 'Turkish', level: 'Native' },
  { name: 'English', level: 'Professional' },
  { name: 'German', level: 'Limited' },
];
