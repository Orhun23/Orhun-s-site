// Everything that makes each role's own page: context on the company, a step-through of the
// work, and only that role's figures. Facts about the work come from Orhun's CV; company
// context is written from the companies' public sites, in my words.
import type { ImageMetadata } from 'astro';

import indiaSorter from '../assets/media/work/india-sorter.jpg';
import indiaCabinet from '../assets/media/work/india-cabinet.jpg';
import indiaTeam from '../assets/media/work/india-team.jpg';
import ukRobot from '../assets/media/work/uk-robot.jpg';
import ukSorter from '../assets/media/work/uk-sorter.jpg';
import ukLayout from '../assets/media/work/uk-layout.jpg';
import teampiArch from '../assets/media/work/teampi-architecture.jpg';
import teampiWiring from '../assets/media/work/teampi-wiring.jpg';
import teampiChassis from '../assets/media/work/teampi-chassis.jpg';
import teampiStage from '../assets/media/work/teampi-stage.jpg';

export type Figure = { src: ImageMetadata; alt: string; caption: string };
export type Step = { title: string; text: string };
export type Diagram = 'sorter' | 'determinism' | 'behaviour-tree' | 'driver-stack' | 'robot';

export type RoleExtra = {
  company: string; // what the company does
  context: string; // why I was there / what the job was
  steps: Step[];
  figures: Figure[];
  diagram: Diagram;
  facts: [string, string][];
};

export const roleExtras: Record<string, RoleExtra> = {
  'vi-controls': {
    company:
      'Vanderlande builds the systems that move bags through airports and parcels through distribution centres: conveyors, sorters, the software that runs them. Lots of steel, lots of PLCs.',
    context:
      'My job was to make those systems work on the customer’s site. Arrive with a team of two to four, get the controls up, prove they do what the spec says, find out why they don’t, and hand it over.',
    steps: [
      { title: 'Bring-up', text: 'Power on, I/O checks, PLCs talking over Profinet, FSC safety in place, the Debian-based flow controller running.' },
      { title: 'Verify against spec', text: 'Every function checked against the specification before the customer sees it.' },
      { title: 'Fault-find on site', text: 'Whatever doesn’t behave gets traced down on the floor: wiring, config, logic, mechanics.' },
      { title: 'Handover', text: 'Through acceptance and into the customer’s hands. Longest one: six months on an XXL loop sorter in the UK, 800+ destinations.' },
    ],
    figures: [
      { src: indiaSorter, alt: 'A loop sorter snaking through a new distribution centre in India, seen from a mezzanine', caption: 'Loop sorter, India' },
      { src: indiaCabinet, alt: 'Two laptops on a desk in front of open control cabinets', caption: 'Office for the week: in front of the cabinets' },
      { src: ukSorter, alt: 'A long sorter line in a UK distribution centre with yellow safety posts', caption: 'XXL loop sorter, UK' },
      { src: ukRobot, alt: 'Orhun in a hard hat and hi-vis next to a yellow industrial robot arm', caption: 'UK site' },
      { src: ukLayout, alt: 'A printed sorter layout marked up by hand with numbered areas', caption: 'Layout, marked up during a shift' },
      { src: indiaTeam, alt: 'Orhun with the site team on a yellow mezzanine above the sorter', caption: 'Site team, India' },
    ],
    diagram: 'sorter',
    facts: [
      ['Sites', 'UK, India'],
      ['Team', '2–4 engineers'],
      ['Longest stint', '6 months, UK'],
      ['Biggest', 'XXL loop sorter, 800+ destinations'],
    ],
  },
  'vi-graduation': {
    company:
      'Same company, different question. Vanderlande’s controls run on classic PLC hardware. New platforms promise to run control as software on normal IT infrastructure.',
    context:
      'My graduation project: is that a good idea for them? I compared a Siemens platform that unifies control types against vendor-independent options, and tested what moving control from OT hardware to IT (Docker containers) does to deterministic behaviour.',
    steps: [
      { title: 'The question', text: 'Can a unified Siemens platform replace the traditional PLC architecture, and how does it compare to vendor-independent options?' },
      { title: 'Build the test platform', text: 'Built the evaluation platform myself, in IEC 61131-3 Structured Text.' },
      { title: 'Measure determinism', text: 'Ran the validation test plan: what happens to timing when control moves off dedicated hardware and into containers.' },
      { title: 'Write it up', text: 'Results and a recommendation in the graduation report. Final grade for the degree: 8/10.' },
    ],
    figures: [],
    diagram: 'determinism',
    facts: [
      ['Type', 'Feasibility study'],
      ['Language', 'IEC 61131-3 ST'],
      ['Compared', 'Siemens vs vendor-independent'],
      ['Key question', 'Determinism on IT hardware'],
    ],
  },
  wefabricate: {
    company:
      'WeFabricate is a contract manufacturer in Best: electronics, system integration, injection moulding and machining under one roof. They build other people’s products, and a few of their own.',
    context:
      'I worked on the Bin-Handler, a station that registers bins brought in by AGVs. Its control software needed to scale, so I rewrote it.',
    steps: [
      { title: 'Rewrite in C++', text: 'New control software for the Bin-Handler, re-architected so it scales.' },
      { title: 'ROS2 for comms', text: 'Modular communication between the parts of the station.' },
      { title: 'Behaviour tree', text: 'The station’s logic as a C++ behaviour tree, with custom nodes in Groot so you can see and edit it.' },
      { title: 'Digital twin', text: 'A Gazebo simulation built from a URDF, covering the full range of motion. Test without the hardware.' },
    ],
    figures: [],
    diagram: 'behaviour-tree',
    facts: [
      ['Machine', 'Bin-Handler (AGV-fed)'],
      ['Language', 'C++'],
      ['Middleware', 'ROS2'],
      ['Sim', 'Gazebo + URDF'],
    ],
  },
  fyllar: {
    company:
      'Fyllar, part of WeFabricate, makes a smart refill station: you bring your own bottle, pick detergent or soap on a touch screen, and it fills it without the mess. Less single-use plastic in shops.',
    context:
      'Inside a dispenser like that there are motors that need to be told exactly what to do. I wrote the low-level driver for the motor driver chip.',
    steps: [
      { title: 'Read the datasheet', text: 'The MCF8329A: a three-phase BLDC gate driver with field-oriented control, configured over I²C.' },
      { title: 'Register map → driver', text: 'A C++ driver library written straight from the register map.' },
      { title: 'Ship it', text: 'The library went into Fyllar’s dispensing machine.' },
      { title: 'Test automation', text: 'A C# proof of concept for automated unit testing on the side.' },
    ],
    figures: [],
    diagram: 'driver-stack',
    facts: [
      ['Chip', 'MCF8329A (BLDC, FOC)'],
      ['Bus', 'I²C'],
      ['Language', 'C++, C#'],
      ['Status', 'Shipped'],
    ],
  },
  teampi: {
    company: 'Robotics Team Pi is a student robotics team from Eindhoven that builds a new robot for competition every season.',
    context: 'I was one of two software engineers and designed the software architecture for that season’s robot, PHINIX.',
    steps: [
      { title: 'Architecture', text: 'The full software architecture for PHINIX, drawn on a whiteboard first.' },
      { title: 'Sensor comms', text: 'Getting every sensor talking to the rest of the robot.' },
      { title: 'Vision', text: 'Object detection in Python and OpenCV with a depth camera.' },
      { title: 'Competition', text: 'Third place at the regional competition.' },
    ],
    figures: [
      { src: teampiArch, alt: 'Whiteboard covered in a hand-drawn software architecture diagram', caption: 'PHINIX software architecture, v1' },
      { src: teampiChassis, alt: 'The robot chassis half-built on a workbench', caption: 'Chassis, mid-build' },
      { src: teampiWiring, alt: 'Dense wiring and controllers inside the robot', caption: 'Inside' },
      { src: teampiStage, alt: 'Orhun crouching next to the red Team Pi robot on stage', caption: 'On stage' },
    ],
    diagram: 'robot',
    facts: [
      ['Robot', 'PHINIX'],
      ['Role', '1 of 2 software engineers'],
      ['Vision', 'Python + OpenCV, depth camera'],
      ['Result', '3rd, regional'],
    ],
  },
};
