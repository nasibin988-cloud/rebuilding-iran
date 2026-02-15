'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Section, LectureMeta, ACT_MAP, SECTION_MAP } from '@/lib/types';
import { useProgress } from '@/components/Providers';

interface Props {
  sections: Section[];
  lectures: LectureMeta[];
}

interface Node {
  id: string;
  type: 'act' | 'section' | 'lecture';
  label: string;
  actNum: number;
  x: number;
  y: number;
  slug?: string;
  completed?: boolean;
}

interface Edge {
  from: string;
  to: string;
  type: 'hierarchy' | 'crossref';
}

const ACT_COLORS = {
  1: { bg: '#0d9488', light: '#5eead4' },
  2: { bg: '#3466ae', light: '#7aa4db' },
  3: { bg: '#c7923e', light: '#e0a04a' },
  4: { bg: '#7c3aed', light: '#a78bfa' },
};

export default function ConceptMapClient({ sections, lectures }: Props) {
  const { isCompleted, completedCount } = useProgress();
  const [selectedAct, setSelectedAct] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'acts' | 'sections' | 'full'>('sections');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width - 40, 600),
          height: Math.max(rect.height - 100, 500),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    if (viewMode === 'acts') {
      // Show only acts in a diamond pattern
      const actPositions = [
        { x: centerX, y: centerY - 150 },      // Act I - top
        { x: centerX + 200, y: centerY },       // Act II - right
        { x: centerX, y: centerY + 150 },       // Act III - bottom
        { x: centerX - 200, y: centerY },       // Act IV - left
      ];

      Object.entries(ACT_MAP).forEach(([actNum, info], idx) => {
        const pos = actPositions[idx];
        nodes.push({
          id: `act-${actNum}`,
          type: 'act',
          label: `${info.label}: ${info.name}`,
          actNum: parseInt(actNum),
          x: pos.x,
          y: pos.y,
        });
      });

      // Connect acts sequentially
      edges.push({ from: 'act-1', to: 'act-2', type: 'hierarchy' });
      edges.push({ from: 'act-2', to: 'act-3', type: 'hierarchy' });
      edges.push({ from: 'act-3', to: 'act-4', type: 'hierarchy' });

    } else if (viewMode === 'sections') {
      // Show sections grouped by act
      const actGroups: Record<number, Section[]> = { 1: [], 2: [], 3: [], 4: [] };
      sections.forEach(sec => {
        if (actGroups[sec.actNum]) {
          actGroups[sec.actNum].push(sec);
        }
      });

      const actStartAngles = [
        -Math.PI / 2,           // Act I starts at top
        0,                      // Act II starts at right
        Math.PI / 2,            // Act III starts at bottom
        Math.PI,                // Act IV starts at left
      ];

      let globalIndex = 0;
      Object.entries(actGroups).forEach(([actNumStr, actSections]) => {
        const actNum = parseInt(actNumStr);
        const startAngle = actStartAngles[actNum - 1];
        const arcLength = Math.PI / 2 * 0.9; // Each act takes ~90 degrees
        const radius = Math.min(width, height) * 0.38;

        actSections.forEach((sec, idx) => {
          const angle = startAngle + (idx / Math.max(actSections.length - 1, 1)) * arcLength;
          const secCompleted = sec.lectures.filter(l => isCompleted(l.slug)).length;

          nodes.push({
            id: `sec-${sec.num}`,
            type: 'section',
            label: `${sec.num}. ${sec.name}`,
            actNum,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            slug: `${sec.num}-001`,
            completed: secCompleted === sec.lectures.length,
          });

          // Connect to previous section in same act
          if (idx > 0) {
            const prevSec = actSections[idx - 1];
            edges.push({
              from: `sec-${prevSec.num}`,
              to: `sec-${sec.num}`,
              type: 'hierarchy',
            });
          }

          globalIndex++;
        });

        // Connect last section of one act to first of next
        if (actNum < 4) {
          const nextActSections = actGroups[actNum + 1];
          if (actSections.length > 0 && nextActSections && nextActSections.length > 0) {
            edges.push({
              from: `sec-${actSections[actSections.length - 1].num}`,
              to: `sec-${nextActSections[0].num}`,
              type: 'hierarchy',
            });
          }
        }
      });

      // Add cross-reference edges based on thematic connections
      const thematicConnections = [
        ['007', '019'], // Revolution -> Science of Revolution
        ['008', '021'], // Islamic Republic -> Failed Transitions
        ['006', '020'], // Modern Era -> Successful Transitions
        ['011', '018'], // Classical Philosophy -> Statesmanship
        ['012', '016'], // Ethics -> Law & Justice
        ['022', '023'], // Economics -> Iran's Economy
        ['010', '028'], // Iran Today -> Day After
        ['009', '030'], // Iranian Spirit -> Long Game
        ['003', '004'], // Arab Conquest -> Persian Renaissance
        ['017', '029'], // Political Systems -> Building New Iran
      ];

      thematicConnections.forEach(([from, to]) => {
        edges.push({ from: `sec-${from}`, to: `sec-${to}`, type: 'crossref' });
      });

    } else if (viewMode === 'full') {
      // Show selected section's lectures or all lectures
      const filteredSections = selectedAct
        ? sections.filter(s => s.actNum === selectedAct)
        : sections;

      const lecturesPerRow = Math.ceil(Math.sqrt(lectures.length));
      const spacing = Math.min(width, height) / (lecturesPerRow + 1);

      let lecIndex = 0;
      filteredSections.forEach(sec => {
        sec.lectures.forEach(lec => {
          const row = Math.floor(lecIndex / lecturesPerRow);
          const col = lecIndex % lecturesPerRow;

          nodes.push({
            id: `lec-${lec.slug}`,
            type: 'lecture',
            label: lec.title,
            actNum: lec.actNum,
            x: 50 + col * spacing,
            y: 50 + row * spacing,
            slug: lec.slug,
            completed: isCompleted(lec.slug),
          });

          // Connect to previous lecture in section
          if (sec.lectures.indexOf(lec) > 0) {
            const prevLec = sec.lectures[sec.lectures.indexOf(lec) - 1];
            edges.push({
              from: `lec-${prevLec.slug}`,
              to: `lec-${lec.slug}`,
              type: 'hierarchy',
            });
          }

          lecIndex++;
        });
      });
    }

    return { nodes, edges };
  }, [sections, lectures, dimensions, viewMode, selectedAct, isCompleted]);

  const totalLectures = lectures.length;
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  return (
    <div ref={containerRef} className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-dark-800 px-4 sm:px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-dark-400 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Concept Map</h1>
              <p className="text-2xs text-dark-400">
                {progressPct}% complete ({completedCount}/{totalLectures} lectures)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg overflow-hidden border border-dark-700">
              {['acts', 'sections', 'full'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as 'acts' | 'sections' | 'full')}
                  className={`px-3 py-1.5 text-2xs font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-persian-600 text-white'
                      : 'bg-dark-800 hover:bg-dark-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {viewMode === 'full' && (
              <select
                value={selectedAct ?? ''}
                onChange={e => setSelectedAct(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-2xs"
              >
                <option value="">All Acts</option>
                {Object.entries(ACT_MAP).map(([num, info]) => (
                  <option key={num} value={num}>{info.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 py-3 border-b border-dark-800 shrink-0">
        <div className="flex flex-wrap items-center gap-4 max-w-7xl mx-auto text-2xs">
          <span className="text-dark-400">Acts:</span>
          {Object.entries(ACT_MAP).map(([num, info]) => (
            <div key={num} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ACT_COLORS[parseInt(num) as keyof typeof ACT_COLORS].bg }}
              />
              <span className="text-dark-300">{info.label}</span>
            </div>
          ))}
          <span className="ml-4 text-dark-400">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-turquoise-500 bg-turquoise-500/30" />
            <span className="text-dark-300">Completed</span>
          </div>
          {viewMode === 'sections' && (
            <>
              <span className="ml-4 text-dark-400">|</span>
              <div className="flex items-center gap-1.5">
                <svg width="20" height="2">
                  <line x1="0" y1="1" x2="20" y2="1" stroke="rgba(199, 146, 62, 0.5)" strokeWidth="1" strokeDasharray="4,2" />
                </svg>
                <span className="text-dark-300">Thematic Link</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Visualization */}
      <div className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto"
          style={{ maxWidth: '100%' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.3)" />
            </marker>
            <marker
              id="arrowhead-crossref"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="rgba(199, 146, 62, 0.5)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isCrossRef = edge.type === 'crossref';
            const isHovered = hoveredNode === edge.from || hoveredNode === edge.to;

            return (
              <line
                key={idx}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isCrossRef ? 'rgba(199, 146, 62, 0.3)' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={isCrossRef ? 1 : 2}
                strokeDasharray={isCrossRef ? '6,4' : undefined}
                opacity={isHovered ? 1 : 0.6}
                markerEnd={isCrossRef ? 'url(#arrowhead-crossref)' : undefined}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const colors = ACT_COLORS[node.actNum as keyof typeof ACT_COLORS] || ACT_COLORS[1];
            const isHovered = hoveredNode === node.id;
            const size = node.type === 'act' ? 60 : node.type === 'section' ? 40 : 25;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: node.slug ? 'pointer' : 'default' }}
                onClick={() => {
                  if (node.slug) {
                    window.location.href = `/lecture/${node.slug}`;
                  }
                }}
              >
                {/* Node circle */}
                <circle
                  r={size / 2}
                  fill={node.completed ? colors.light : colors.bg}
                  fillOpacity={node.completed ? 0.3 : 0.8}
                  stroke={node.completed ? colors.light : colors.bg}
                  strokeWidth={node.completed ? 3 : 2}
                  className="transition-all duration-200"
                  style={{
                    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : undefined,
                  }}
                />

                {/* Completed checkmark */}
                {node.completed && (
                  <path
                    d={size > 30 ? 'M-8 0 L-3 5 L8 -6' : 'M-5 0 L-2 3 L5 -4'}
                    fill="none"
                    stroke={colors.light}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Label */}
                {(node.type !== 'lecture' || isHovered) && (
                  <text
                    y={size / 2 + 14}
                    textAnchor="middle"
                    className="text-2xs fill-current"
                    style={{
                      fontSize: node.type === 'act' ? '12px' : node.type === 'section' ? '10px' : '9px',
                      fontWeight: node.type === 'act' ? 600 : 500,
                      opacity: isHovered ? 1 : 0.9,
                    }}
                  >
                    {node.label.length > 20 ? node.label.slice(0, 20) + '...' : node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card rounded-lg px-4 py-2 text-sm max-w-md">
            {(() => {
              const node = nodes.find(n => n.id === hoveredNode);
              if (!node) return null;
              return (
                <div>
                  <p className="font-medium">{node.label}</p>
                  <p className="text-2xs text-dark-400">
                    {node.type === 'act' && `Click to explore ${ACT_MAP[node.actNum]?.sectionNums.length || 0} sections`}
                    {node.type === 'section' && (
                      node.completed ? 'Completed! Click to review' : 'Click to start learning'
                    )}
                    {node.type === 'lecture' && (
                      node.completed ? 'Completed! Click to review' : 'Click to read'
                    )}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="px-4 sm:px-6 py-3 border-t border-dark-800 text-center text-2xs text-dark-400 shrink-0">
        Hover over nodes to see details. Click on sections or lectures to navigate.
        {viewMode === 'sections' && ' Dashed lines show thematic connections between sections.'}
      </div>
    </div>
  );
}
