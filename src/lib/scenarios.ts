// Scenario Assessment Types and Data
// Interactive decision trees for practicing ethical decision-making

export interface ScenarioChoice {
  id: string;
  text: string;
  nextNodeId: string | null; // null means end of scenario
  consequence: string;
  score: number; // Positive for good choices, negative for poor choices
  principles: string[]; // Relevant curriculum principles
}

export interface ScenarioNode {
  id: string;
  type: 'situation' | 'reflection' | 'outcome';
  content: string;
  context?: string;
  choices?: ScenarioChoice[];
  outcome?: {
    title: string;
    description: string;
    lessonsLearned: string[];
    relatedLectures: string[]; // lecture slugs
  };
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'civic' | 'economic' | 'social' | 'political';
  estimatedTime: string;
  coverImage?: string;
  nodes: Record<string, ScenarioNode>;
  startNodeId: string;
}

// Scenario Data
export const SCENARIOS: Scenario[] = [
  {
    id: 'local-council-vote',
    title: 'The Local Council Vote',
    description: 'You are a newly elected member of a local council. A controversial development project is being proposed. How will you navigate competing interests while upholding democratic principles?',
    difficulty: 'beginner',
    category: 'civic',
    estimatedTime: '10-15 min',
    startNodeId: 'start',
    nodes: {
      'start': {
        id: 'start',
        type: 'situation',
        content: 'You have just been elected to your local district council. A major developer has proposed building a large commercial complex on public land. The project promises jobs but would require demolishing a community park that has been cherished by residents for decades.',
        context: 'This is your first major vote as a council member. Both sides are watching closely to see how you will decide.',
        choices: [
          {
            id: 'a1',
            text: 'Vote immediately in favor of the development to show decisiveness',
            nextNodeId: 'hasty-decision',
            consequence: 'You vote without fully understanding the implications',
            score: -2,
            principles: ['Deliberation', 'Due Process']
          },
          {
            id: 'a2',
            text: 'Request more time to gather community input',
            nextNodeId: 'community-input',
            consequence: 'You demonstrate commitment to participatory decision-making',
            score: 3,
            principles: ['Public Participation', 'Transparency']
          },
          {
            id: 'a3',
            text: 'Vote against immediately to please your voters',
            nextNodeId: 'reactive-decision',
            consequence: 'You react without considering all perspectives',
            score: -1,
            principles: ['Independent Judgment', 'Deliberation']
          }
        ]
      },
      'hasty-decision': {
        id: 'hasty-decision',
        type: 'situation',
        content: 'Your hasty vote draws criticism from multiple sides. Community members feel unheard, and even the developer is surprised by the lack of due process. A local newspaper runs a story questioning your judgment.',
        context: 'The vote passed, but now there are calls for a review of the decision.',
        choices: [
          {
            id: 'b1',
            text: 'Defend your decision and refuse to reconsider',
            nextNodeId: 'outcome-stubborn',
            consequence: 'You prioritize appearing consistent over doing what is right',
            score: -2,
            principles: ['Accountability', 'Humility']
          },
          {
            id: 'b2',
            text: 'Acknowledge the error and request a formal review',
            nextNodeId: 'course-correction',
            consequence: 'You demonstrate accountability and willingness to correct mistakes',
            score: 2,
            principles: ['Accountability', 'Integrity']
          }
        ]
      },
      'community-input': {
        id: 'community-input',
        type: 'situation',
        content: 'You organize a series of town hall meetings. The discussions reveal that while many want jobs, there is also deep attachment to the park. Some propose a compromise: a smaller development that preserves half the park.',
        context: 'Both the developer and community activists are now engaging constructively.',
        choices: [
          {
            id: 'c1',
            text: 'Push for the compromise solution',
            nextNodeId: 'compromise-path',
            consequence: 'You work to find middle ground that respects multiple interests',
            score: 3,
            principles: ['Compromise', 'Civic Engagement']
          },
          {
            id: 'c2',
            text: 'Let the community vote directly on the issue',
            nextNodeId: 'direct-democracy',
            consequence: 'You empower citizens to make the decision themselves',
            score: 2,
            principles: ['Direct Democracy', 'Sovereignty']
          },
          {
            id: 'c3',
            text: 'Use the input to make your own independent decision',
            nextNodeId: 'representative-decision',
            consequence: 'You exercise representative judgment informed by public input',
            score: 2,
            principles: ['Representative Democracy', 'Leadership']
          }
        ]
      },
      'reactive-decision': {
        id: 'reactive-decision',
        type: 'situation',
        content: 'Your immediate rejection surprises everyone. The developer threatens to take the project elsewhere, potentially costing the district hundreds of jobs. Some of your own supporters question whether you considered the economic implications.',
        choices: [
          {
            id: 'd1',
            text: 'Stand firm on your position',
            nextNodeId: 'outcome-rigid',
            consequence: 'You maintain your position regardless of new information',
            score: 0,
            principles: ['Conviction', 'Consistency']
          },
          {
            id: 'd2',
            text: 'Reach out to the developer to explore alternatives',
            nextNodeId: 'negotiation-path',
            consequence: 'You show willingness to engage despite initial disagreement',
            score: 2,
            principles: ['Negotiation', 'Pragmatism']
          }
        ]
      },
      'course-correction': {
        id: 'course-correction',
        type: 'situation',
        content: 'Your willingness to admit error and request a review earns respect. The council agrees to hold proper consultations before any final decision. You are asked to chair the review committee.',
        choices: [
          {
            id: 'e1',
            text: 'Accept the responsibility and ensure a fair process',
            nextNodeId: 'outcome-redemption',
            consequence: 'You turn a mistake into an opportunity for better governance',
            score: 3,
            principles: ['Leadership', 'Process Integrity']
          },
          {
            id: 'e2',
            text: 'Decline, feeling you have lost credibility',
            nextNodeId: 'outcome-resignation',
            consequence: 'You step back rather than leading the correction',
            score: -1,
            principles: ['Responsibility', 'Resilience']
          }
        ]
      },
      'compromise-path': {
        id: 'compromise-path',
        type: 'situation',
        content: 'You work tirelessly to negotiate the compromise. The developer agrees to a smaller footprint, and the community accepts partial development. Both sides credit you with finding a workable solution.',
        choices: [
          {
            id: 'f1',
            text: 'Present the compromise to the council for a vote',
            nextNodeId: 'outcome-consensus',
            consequence: 'You complete the democratic process with an informed vote',
            score: 3,
            principles: ['Consensus Building', 'Democratic Process']
          }
        ]
      },
      'direct-democracy': {
        id: 'direct-democracy',
        type: 'reflection',
        content: 'The community referendum is held. After vigorous debate, citizens vote 52% to 48% in favor of a modified development plan. While some are unhappy, there is broad acceptance of the democratic outcome.',
        choices: [
          {
            id: 'g1',
            text: 'Implement the result and work to heal divisions',
            nextNodeId: 'outcome-unity',
            consequence: 'You respect the democratic choice and work on reconciliation',
            score: 2,
            principles: ['Democratic Legitimacy', 'Unity']
          }
        ]
      },
      'representative-decision': {
        id: 'representative-decision',
        type: 'situation',
        content: 'After careful consideration of all input, you propose a third option: use part of the land for development, create a new park nearby with better facilities, and establish a community oversight committee for the project.',
        choices: [
          {
            id: 'h1',
            text: 'Champion your proposal through the council',
            nextNodeId: 'outcome-innovation',
            consequence: 'You exercise creative leadership based on constituent input',
            score: 3,
            principles: ['Innovation', 'Representation']
          }
        ]
      },
      'negotiation-path': {
        id: 'negotiation-path',
        type: 'situation',
        content: 'The developer is initially skeptical but agrees to meet. Through several rounds of negotiation, you discover they are flexible on the design and would consider including green spaces if the overall project can proceed.',
        choices: [
          {
            id: 'i1',
            text: 'Work toward a revised proposal that addresses community concerns',
            nextNodeId: 'outcome-negotiation-success',
            consequence: 'You turn confrontation into collaboration',
            score: 3,
            principles: ['Diplomacy', 'Problem-Solving']
          }
        ]
      },
      'outcome-stubborn': {
        id: 'outcome-stubborn',
        type: 'outcome',
        content: 'Your refusal to reconsider damages your credibility.',
        outcome: {
          title: 'Lost Trust',
          description: 'Your unwillingness to acknowledge error or engage with criticism has damaged your effectiveness as a council member. While the development proceeds, community trust in the council has eroded.',
          lessonsLearned: [
            'Being wrong is human; refusing to correct course is a choice',
            'Accountability strengthens rather than weakens leadership',
            'Public trust requires ongoing engagement, not just electoral victory'
          ],
          relatedLectures: ['002-003', '003-001']
        }
      },
      'outcome-rigid': {
        id: 'outcome-rigid',
        type: 'outcome',
        content: 'The development goes elsewhere.',
        outcome: {
          title: 'Pyrrhic Victory',
          description: 'The park is saved, but the district loses significant economic opportunity. While some praise your principled stand, others question whether a better outcome was possible through negotiation.',
          lessonsLearned: [
            'Principled positions must be balanced with pragmatic outcomes',
            'Refusing to negotiate is itself a choice with consequences',
            'Democracy requires engaging with those we disagree with'
          ],
          relatedLectures: ['003-002', '002-001']
        }
      },
      'outcome-redemption': {
        id: 'outcome-redemption',
        type: 'outcome',
        content: 'You lead a model process.',
        outcome: {
          title: 'Redemption Through Process',
          description: 'By acknowledging your initial error and leading a proper review, you demonstrate that democratic institutions can self-correct. The eventual decision, whatever it is, has legitimacy because the process was fair.',
          lessonsLearned: [
            'Mistakes are opportunities for demonstrating integrity',
            'Process matters as much as outcomes in democracy',
            'Leadership means taking responsibility for both errors and corrections'
          ],
          relatedLectures: ['002-002', '003-003']
        }
      },
      'outcome-resignation': {
        id: 'outcome-resignation',
        type: 'outcome',
        content: 'You step back from leadership.',
        outcome: {
          title: 'Missed Opportunity',
          description: 'Your reluctance to lead the review process means someone less invested chairs it. The outcome is acceptable, but you have missed an opportunity to demonstrate that leaders can learn from mistakes.',
          lessonsLearned: [
            'Resilience is essential for democratic leadership',
            'One mistake does not define a career',
            'Citizens respect leaders who persist through difficulty'
          ],
          relatedLectures: ['002-004', '001-003']
        }
      },
      'outcome-consensus': {
        id: 'outcome-consensus',
        type: 'outcome',
        content: 'The compromise is approved.',
        outcome: {
          title: 'Consensus Builder',
          description: 'Your patient work to find middle ground has resulted in an outcome that most can accept. The development proceeds in a modified form, the park is partially preserved, and you have established yourself as someone who can bridge divides.',
          lessonsLearned: [
            'Compromise is not weakness but democratic strength',
            'Taking time for consultation builds legitimacy',
            'Creative solutions can emerge from patient dialogue'
          ],
          relatedLectures: ['003-001', '003-004']
        }
      },
      'outcome-unity': {
        id: 'outcome-unity',
        type: 'outcome',
        content: 'The community moves forward together.',
        outcome: {
          title: 'Democratic Healing',
          description: 'By letting citizens decide directly and then working to bring the community together, you have strengthened democratic culture. Even those who lost the vote feel their voice was heard.',
          lessonsLearned: [
            'Direct democracy can resolve divisive issues',
            'The work continues after the vote',
            'Legitimacy comes from fair process, not just favorable outcomes'
          ],
          relatedLectures: ['001-002', '002-001']
        }
      },
      'outcome-innovation': {
        id: 'outcome-innovation',
        type: 'outcome',
        content: 'Your creative solution wins support.',
        outcome: {
          title: 'Innovative Leadership',
          description: 'By listening carefully and thinking creatively, you found a solution that no one had originally proposed but that addresses core concerns of all sides. You have demonstrated that representative democracy can produce wise outcomes.',
          lessonsLearned: [
            'Representatives should synthesize, not just aggregate preferences',
            'Creative solutions often emerge from understanding underlying interests',
            'Leadership means proposing, not just choosing between options'
          ],
          relatedLectures: ['002-003', '003-002']
        }
      },
      'outcome-negotiation-success': {
        id: 'outcome-negotiation-success',
        type: 'outcome',
        content: 'Negotiation yields a better outcome.',
        outcome: {
          title: 'From Opposition to Partnership',
          description: 'What began as confrontation has become collaboration. The revised proposal incorporates green spaces and community benefits that were not in the original plan. Both you and the developer have learned that engagement produces better outcomes than entrenchment.',
          lessonsLearned: [
            'Initial positions are often starting points for negotiation',
            'Understanding interests behind positions opens new possibilities',
            'Even opponents can become partners in problem-solving'
          ],
          relatedLectures: ['003-003', '002-002']
        }
      }
    }
  },
  {
    id: 'media-ethics',
    title: 'The Journalist\'s Dilemma',
    description: 'As an independent journalist in a transitional democracy, you uncover evidence of corruption. But publishing could destabilize important reforms. How do you balance truth-telling with responsibility?',
    difficulty: 'intermediate',
    category: 'social',
    estimatedTime: '12-18 min',
    startNodeId: 'start',
    nodes: {
      'start': {
        id: 'start',
        type: 'situation',
        content: 'You are an investigative journalist working for an independent news outlet. You have uncovered documents showing that a reform-minded minister, widely seen as essential to the democratic transition, accepted payments from a business group seeking government contracts.',
        context: 'The minister has been crucial in advancing anti-corruption reforms. Exposing them could embolden authoritarian forces seeking to reverse democratization.',
        choices: [
          {
            id: 'a1',
            text: 'Publish immediately - the public has a right to know',
            nextNodeId: 'immediate-publish',
            consequence: 'You prioritize transparency above all other considerations',
            score: 1,
            principles: ['Press Freedom', 'Transparency']
          },
          {
            id: 'a2',
            text: 'Investigate further to understand the full context',
            nextNodeId: 'deeper-investigation',
            consequence: 'You seek complete understanding before acting',
            score: 3,
            principles: ['Due Diligence', 'Accuracy']
          },
          {
            id: 'a3',
            text: 'Quietly approach the minister for their response first',
            nextNodeId: 'minister-approach',
            consequence: 'You follow journalistic ethics of seeking comment',
            score: 2,
            principles: ['Fairness', 'Due Process']
          },
          {
            id: 'a4',
            text: 'Suppress the story for the sake of political stability',
            nextNodeId: 'suppression',
            consequence: 'You prioritize stability over transparency',
            score: -2,
            principles: ['Independence', 'Truth-Telling']
          }
        ]
      },
      'immediate-publish': {
        id: 'immediate-publish',
        type: 'situation',
        content: 'Your story creates a political earthquake. The minister denies the allegations and claims the documents are forgeries. Without time for verification, your credibility is questioned. The story becomes about you as much as the corruption.',
        choices: [
          {
            id: 'b1',
            text: 'Double down and publish more evidence',
            nextNodeId: 'evidence-battle',
            consequence: 'You fight to establish the truth of your reporting',
            score: 1,
            principles: ['Persistence', 'Truth-Seeking']
          },
          {
            id: 'b2',
            text: 'Acknowledge you should have done more verification',
            nextNodeId: 'outcome-premature',
            consequence: 'You admit procedural errors while standing by the substance',
            score: 0,
            principles: ['Humility', 'Accountability']
          }
        ]
      },
      'deeper-investigation': {
        id: 'deeper-investigation',
        type: 'situation',
        content: 'Your investigation reveals a more complex picture. The minister did accept payments, but they were funneled into a secret fund supporting civil society organizations resisting authoritarian influence. The minister was fighting corruption with questionable methods.',
        context: 'This nuance changes everything - but how do you report it?',
        choices: [
          {
            id: 'c1',
            text: 'Report the full complexity, including the minister\'s justification',
            nextNodeId: 'nuanced-reporting',
            consequence: 'You trust the public to handle complexity',
            score: 3,
            principles: ['Nuance', 'Public Intelligence']
          },
          {
            id: 'c2',
            text: 'Report only the wrongdoing, without the justification',
            nextNodeId: 'partial-truth',
            consequence: 'You simplify the story at the cost of context',
            score: -1,
            principles: ['Accuracy', 'Context']
          },
          {
            id: 'c3',
            text: 'Decide not to publish given the complexity',
            nextNodeId: 'outcome-silence',
            consequence: 'You become a gatekeeper rather than a reporter',
            score: -2,
            principles: ['Press Freedom', 'Transparency']
          }
        ]
      },
      'minister-approach': {
        id: 'minister-approach',
        type: 'situation',
        content: 'The minister is shaken but agrees to meet off the record. They explain that the payments went to support independent judges and journalists being threatened. They ask for 48 hours to arrange immunity for witnesses before you publish.',
        choices: [
          {
            id: 'd1',
            text: 'Grant the 48 hours but verify their claims',
            nextNodeId: 'conditional-delay',
            consequence: 'You balance urgency with responsibility',
            score: 2,
            principles: ['Judgment', 'Responsibility']
          },
          {
            id: 'd2',
            text: 'Refuse - you can\'t let sources control timing',
            nextNodeId: 'publish-anyway',
            consequence: 'You maintain journalistic independence',
            score: 1,
            principles: ['Independence', 'Autonomy']
          },
          {
            id: 'd3',
            text: 'Agree but don\'t verify - you trust their integrity',
            nextNodeId: 'outcome-manipulated',
            consequence: 'You cede control to your subject',
            score: -2,
            principles: ['Skepticism', 'Verification']
          }
        ]
      },
      'suppression': {
        id: 'suppression',
        type: 'situation',
        content: 'You decide not to publish. Weeks later, a rival outlet breaks the story with only partial information, creating a much bigger scandal. Your silence is eventually revealed, destroying your credibility as an independent journalist.',
        choices: [
          {
            id: 'e1',
            text: 'Explain publicly why you made that choice',
            nextNodeId: 'outcome-compromised',
            consequence: 'You try to salvage something from the situation',
            score: -1,
            principles: ['Accountability', 'Transparency']
          }
        ]
      },
      'evidence-battle': {
        id: 'evidence-battle',
        type: 'situation',
        content: 'You release more documents. Independent experts verify their authenticity. The minister\'s denials collapse, but the political fallout is severe. The democratic transition is set back as authoritarian voices cite this as proof that reformers are just as corrupt.',
        choices: [
          {
            id: 'f1',
            text: 'Continue aggressive coverage of all corruption',
            nextNodeId: 'outcome-crusader',
            consequence: 'You become a fearless anti-corruption voice',
            score: 1,
            principles: ['Persistence', 'Anti-Corruption']
          },
          {
            id: 'f2',
            text: 'Reflect on whether your methods served democracy',
            nextNodeId: 'outcome-reflection',
            consequence: 'You question the impact of your approach',
            score: 2,
            principles: ['Responsibility', 'Self-Reflection']
          }
        ]
      },
      'nuanced-reporting': {
        id: 'nuanced-reporting',
        type: 'reflection',
        content: 'Your nuanced story provokes intense debate. Some praise you for trusting the public with complexity. Others accuse you of making excuses for corruption. The minister faces consequences but is not destroyed. Public discourse matures.',
        choices: [
          {
            id: 'g1',
            text: 'Continue with this approach to complex stories',
            nextNodeId: 'outcome-nuance',
            consequence: 'You establish a model for sophisticated journalism',
            score: 3,
            principles: ['Complexity', 'Democratic Discourse']
          }
        ]
      },
      'partial-truth': {
        id: 'partial-truth',
        type: 'situation',
        content: 'Your story leads to the minister\'s resignation. Later, the full context emerges from other sources. Your outlet is criticized for telling only part of the truth. Some question whether you had an agenda.',
        choices: [
          {
            id: 'h1',
            text: 'Publish a follow-up with the full context',
            nextNodeId: 'outcome-correction',
            consequence: 'You try to complete the record',
            score: 1,
            principles: ['Correction', 'Completeness']
          }
        ]
      },
      'conditional-delay': {
        id: 'conditional-delay',
        type: 'situation',
        content: 'During the 48 hours, you verify the minister\'s claims. They are partly true - some money did go to protecting independent voices, but some was also misused. Your eventual story is balanced, accurate, and impactful.',
        choices: [
          {
            id: 'i1',
            text: 'Publish the comprehensive, verified story',
            nextNodeId: 'outcome-excellence',
            consequence: 'You deliver journalism of the highest standard',
            score: 3,
            principles: ['Accuracy', 'Completeness']
          }
        ]
      },
      'publish-anyway': {
        id: 'publish-anyway',
        type: 'situation',
        content: 'You publish without waiting. The minister\'s claims about protecting others are later verified, but witnesses who could have been protected are now exposed. Some face retaliation. Your story is accurate but its impact is complicated.',
        choices: [
          {
            id: 'j1',
            text: 'Report on the retaliation and take some responsibility',
            nextNodeId: 'outcome-consequences',
            consequence: 'You grapple with the real-world impact of your choices',
            score: 1,
            principles: ['Accountability', 'Responsibility']
          }
        ]
      },
      'outcome-premature': {
        id: 'outcome-premature',
        type: 'outcome',
        content: 'Your credibility is damaged.',
        outcome: {
          title: 'Haste Makes Waste',
          description: 'While your story was substantially accurate, rushing to publish without adequate verification allowed critics to question your methods. The important truth you uncovered is overshadowed by debates about journalistic standards.',
          lessonsLearned: [
            'Speed can undermine impact',
            'Verification is not optional, even under competitive pressure',
            'Being first matters less than being right'
          ],
          relatedLectures: ['003-001', '002-002']
        }
      },
      'outcome-silence': {
        id: 'outcome-silence',
        type: 'outcome',
        content: 'You chose silence.',
        outcome: {
          title: 'The Gatekeeper\'s Burden',
          description: 'By deciding that the truth was too complex for the public, you assumed a role that is not yours to play. Democracy depends on informed citizens, not journalists who decide what they can handle.',
          lessonsLearned: [
            'Journalists inform; they do not decide what the public should know',
            'Complexity is not a reason for silence',
            'Trust your audience to engage with difficult truths'
          ],
          relatedLectures: ['001-004', '002-003']
        }
      },
      'outcome-manipulated': {
        id: 'outcome-manipulated',
        type: 'outcome',
        content: 'You were used.',
        outcome: {
          title: 'Trust Without Verification',
          description: 'The minister used your trust to delay and shape the narrative. When the story finally emerged, it was on their terms. Your reputation for independence is damaged.',
          lessonsLearned: [
            'Trust but verify - especially with sources who have something to lose',
            'Independence means not ceding control to subjects',
            'Skepticism is a journalistic virtue, not a flaw'
          ],
          relatedLectures: ['002-001', '003-002']
        }
      },
      'outcome-compromised': {
        id: 'outcome-compromised',
        type: 'outcome',
        content: 'Your explanation falls flat.',
        outcome: {
          title: 'Credibility Lost',
          description: 'Your decision to suppress important information, whatever the reasoning, has destroyed your credibility as an independent journalist. You have become a cautionary tale about the costs of self-censorship.',
          lessonsLearned: [
            'Self-censorship is still censorship',
            'Journalists cannot be guardians of political stability',
            'The public interest is served by information, not protection'
          ],
          relatedLectures: ['001-003', '003-003']
        }
      },
      'outcome-crusader': {
        id: 'outcome-crusader',
        type: 'outcome',
        content: 'You become a symbol of aggressive journalism.',
        outcome: {
          title: 'The Crusader\'s Path',
          description: 'Your fearless pursuit of corruption earns admiration from some and criticism from others. You expose wrongdoing but sometimes at significant cost to individuals and institutions. The question of whether the ends justify the means follows you.',
          lessonsLearned: [
            'Courage is necessary but not sufficient',
            'Impact should be measured, not just celebrated',
            'Even noble ends can be pursued in ways that cause harm'
          ],
          relatedLectures: ['003-004', '002-004']
        }
      },
      'outcome-reflection': {
        id: 'outcome-reflection',
        type: 'outcome',
        content: 'You grow as a journalist.',
        outcome: {
          title: 'Wisdom Through Reflection',
          description: 'Your willingness to question your own methods, even after a "successful" story, marks you as a thoughtful practitioner. You develop a more sophisticated understanding of journalism\'s role in democratic transitions.',
          lessonsLearned: [
            'Success does not preclude self-criticism',
            'Methods matter as much as outcomes',
            'Growth requires honest self-assessment'
          ],
          relatedLectures: ['002-002', '003-001']
        }
      },
      'outcome-nuance': {
        id: 'outcome-nuance',
        type: 'outcome',
        content: 'You model a new kind of journalism.',
        outcome: {
          title: 'The Nuanced Voice',
          description: 'Your commitment to presenting complexity rather than simplifying it establishes a new standard. You trust your audience to engage with difficult truths, and they rise to the occasion. Democratic discourse is elevated.',
          lessonsLearned: [
            'Citizens can handle complexity if journalists present it well',
            'Nuance is not weakness; it is respect for truth',
            'Journalism can elevate rather than simplify public discourse'
          ],
          relatedLectures: ['001-002', '003-002']
        }
      },
      'outcome-correction': {
        id: 'outcome-correction',
        type: 'outcome',
        content: 'You complete the record, but damage is done.',
        outcome: {
          title: 'Better Late Than Never',
          description: 'Your follow-up story provides important context, but the initial framing has already shaped public perception. The minister\'s reputation is destroyed beyond what the full truth would have warranted.',
          lessonsLearned: [
            'First impressions in journalism are often lasting',
            'Context should be part of the initial story, not an afterthought',
            'Corrections rarely have the impact of original reporting'
          ],
          relatedLectures: ['002-003', '003-003']
        }
      },
      'outcome-excellence': {
        id: 'outcome-excellence',
        type: 'outcome',
        content: 'You achieve journalistic excellence.',
        outcome: {
          title: 'The Gold Standard',
          description: 'Your balanced judgment - taking time to verify while not ceding control - produces journalism of the highest quality. The story is accurate, fair, impactful, and responsible. You have demonstrated that these values need not conflict.',
          lessonsLearned: [
            'Excellence requires balancing multiple values',
            'Time for verification is not the same as surrendering independence',
            'The best journalism serves truth and responsibility simultaneously'
          ],
          relatedLectures: ['003-001', '002-001']
        }
      },
      'outcome-consequences': {
        id: 'outcome-consequences',
        type: 'outcome',
        content: 'You confront the human cost of your choices.',
        outcome: {
          title: 'The Weight of Consequences',
          description: 'Your decision to publish quickly was defensible, but it had real costs. By reporting honestly on the retaliation that followed, you demonstrate accountability. You learn that journalism has consequences beyond the story itself.',
          lessonsLearned: [
            'Journalism has real-world consequences for real people',
            'Speed is not the only value in reporting',
            'Acknowledging harm is part of accountability'
          ],
          relatedLectures: ['002-004', '003-004']
        }
      }
    }
  },
  {
    id: 'economic-transition',
    title: 'The Factory Decision',
    description: 'You are a labor union leader as the economy transitions from state control to a mixed system. Workers face uncertainty. How do you protect their interests while enabling necessary reforms?',
    difficulty: 'advanced',
    category: 'economic',
    estimatedTime: '15-20 min',
    startNodeId: 'start',
    nodes: {
      'start': {
        id: 'start',
        type: 'situation',
        content: 'You lead the workers\' union at a large manufacturing plant. The government is privatizing state enterprises. A foreign investor wants to buy the plant, promising modernization and export markets, but also planning to reduce the workforce by 40% over three years.',
        context: 'Workers are anxious. Some see privatization as betrayal; others see it as the only path to sustainable jobs. You must navigate between idealism and pragmatism.',
        choices: [
          {
            id: 'a1',
            text: 'Oppose privatization entirely - demand the plant remain state-owned',
            nextNodeId: 'opposition-path',
            consequence: 'You take a principled stand against market reforms',
            score: 0,
            principles: ['Worker Solidarity', 'State Enterprise']
          },
          {
            id: 'a2',
            text: 'Negotiate for worker protections as a condition of supporting privatization',
            nextNodeId: 'negotiation-path',
            consequence: 'You engage with the process while fighting for workers',
            score: 3,
            principles: ['Pragmatic Unionism', 'Negotiation']
          },
          {
            id: 'a3',
            text: 'Propose a worker-owned cooperative as an alternative',
            nextNodeId: 'cooperative-path',
            consequence: 'You offer a third way between state and private ownership',
            score: 2,
            principles: ['Worker Ownership', 'Economic Democracy']
          },
          {
            id: 'a4',
            text: 'Support privatization to gain favor with the new owners',
            nextNodeId: 'collaboration-path',
            consequence: 'You align with management in hopes of influence',
            score: -2,
            principles: ['Independence', 'Worker Representation']
          }
        ]
      },
      'opposition-path': {
        id: 'opposition-path',
        type: 'situation',
        content: 'Your opposition delays the sale. The government, facing pressure from international lenders, offers a compromise: delay privatization by one year in exchange for accepting a restructuring plan that cuts costs by 20%.',
        choices: [
          {
            id: 'b1',
            text: 'Accept the compromise - buy time to organize alternatives',
            nextNodeId: 'strategic-delay',
            consequence: 'You use delay strategically while preparing for change',
            score: 2,
            principles: ['Strategic Thinking', 'Adaptation']
          },
          {
            id: 'b2',
            text: 'Reject it - continue fighting against any privatization',
            nextNodeId: 'continued-resistance',
            consequence: 'You maintain absolute opposition',
            score: -1,
            principles: ['Principle', 'Intransigence']
          }
        ]
      },
      'negotiation-path': {
        id: 'negotiation-path',
        type: 'situation',
        content: 'The investor agrees to negotiate. They offer: 1) No immediate layoffs; 2) Severance packages for voluntary departures; 3) Training programs for workers transitioning to new roles; 4) A union seat on the company board. In return, they want union support for the acquisition.',
        choices: [
          {
            id: 'c1',
            text: 'Accept the deal - it protects workers during transition',
            nextNodeId: 'deal-accepted',
            consequence: 'You secure concrete protections',
            score: 2,
            principles: ['Pragmatism', 'Worker Protection']
          },
          {
            id: 'c2',
            text: 'Push for more - demand guaranteed employment for five years',
            nextNodeId: 'overreach',
            consequence: 'You risk the deal for better terms',
            score: 1,
            principles: ['Ambition', 'Risk-Taking']
          },
          {
            id: 'c3',
            text: 'Put it to a worker vote - let them decide',
            nextNodeId: 'worker-vote',
            consequence: 'You defer to democratic process',
            score: 3,
            principles: ['Democratic Unionism', 'Participation']
          }
        ]
      },
      'cooperative-path': {
        id: 'cooperative-path',
        type: 'situation',
        content: 'Your cooperative proposal gains attention. Some workers are enthusiastic; others are skeptical about taking on ownership risks. The government is intrigued but uncertain about financing. The foreign investor views you as a competitor.',
        choices: [
          {
            id: 'd1',
            text: 'Build a detailed business plan and seek financing',
            nextNodeId: 'coop-development',
            consequence: 'You pursue the cooperative seriously',
            score: 3,
            principles: ['Initiative', 'Alternative Models']
          },
          {
            id: 'd2',
            text: 'Use the cooperative threat to strengthen negotiating position',
            nextNodeId: 'leverage-coop',
            consequence: 'You use the idea tactically',
            score: 1,
            principles: ['Strategy', 'Leverage']
          }
        ]
      },
      'collaboration-path': {
        id: 'collaboration-path',
        type: 'situation',
        content: 'Your quick support for privatization disappoints workers who expected you to fight for them. The new owners appreciate your cooperation but see no need to offer concessions since you have already agreed. Other union leaders criticize you publicly.',
        choices: [
          {
            id: 'e1',
            text: 'Try to renegotiate from your weakened position',
            nextNodeId: 'outcome-weak-position',
            consequence: 'You attempt to recover',
            score: 0,
            principles: ['Recovery', 'Adaptation']
          },
          {
            id: 'e2',
            text: 'Double down - argue that cooperation is best for workers long-term',
            nextNodeId: 'outcome-sellout',
            consequence: 'You defend your controversial choice',
            score: -1,
            principles: ['Consistency', 'Conviction']
          }
        ]
      },
      'strategic-delay': {
        id: 'strategic-delay',
        type: 'situation',
        content: 'During the year\'s delay, you organize worker training, build community support, and explore alternative ownership models. When privatization talks resume, you are in a much stronger position. Multiple investors now compete for the plant.',
        choices: [
          {
            id: 'f1',
            text: 'Use competition between bidders to get the best deal for workers',
            nextNodeId: 'outcome-strategic-success',
            consequence: 'You leverage your improved position',
            score: 3,
            principles: ['Strategy', 'Leverage']
          }
        ]
      },
      'continued-resistance': {
        id: 'continued-resistance',
        type: 'situation',
        content: 'Your continued opposition leads to a confrontation. The government threatens to close the plant entirely rather than maintain an unprofitable state enterprise. Workers are divided - some support your stand, others fear losing everything.',
        choices: [
          {
            id: 'g1',
            text: 'Organize a strike to force a better outcome',
            nextNodeId: 'strike-outcome',
            consequence: 'You escalate to direct action',
            score: 0,
            principles: ['Direct Action', 'Risk']
          },
          {
            id: 'g2',
            text: 'Finally negotiate before the plant closes',
            nextNodeId: 'outcome-forced-negotiation',
            consequence: 'You negotiate from a position of weakness',
            score: -1,
            principles: ['Pragmatism', 'Timing']
          }
        ]
      },
      'deal-accepted': {
        id: 'deal-accepted',
        type: 'reflection',
        content: 'The deal is implemented. Over three years, the workforce shrinks through voluntary departures and retraining, not layoffs. The plant becomes profitable and stable. Some workers thrive in new roles; others struggle with change.',
        choices: [
          {
            id: 'h1',
            text: 'Monitor implementation and advocate for struggling workers',
            nextNodeId: 'outcome-managed-transition',
            consequence: 'You remain engaged as the transition unfolds',
            score: 2,
            principles: ['Follow-Through', 'Advocacy']
          }
        ]
      },
      'overreach': {
        id: 'overreach',
        type: 'situation',
        content: 'The investor views your demand as unreasonable and walks away. Another buyer emerges, but offers worse terms: immediate layoffs with minimal severance. Workers blame you for losing the better deal.',
        choices: [
          {
            id: 'i1',
            text: 'Accept the worse deal - something is better than nothing',
            nextNodeId: 'outcome-worse-deal',
            consequence: 'You salvage what you can',
            score: -1,
            principles: ['Damage Control', 'Reality']
          },
          {
            id: 'i2',
            text: 'Refuse and continue fighting for better terms',
            nextNodeId: 'outcome-continued-fight',
            consequence: 'You refuse to accept defeat',
            score: 0,
            principles: ['Persistence', 'Principle']
          }
        ]
      },
      'worker-vote': {
        id: 'worker-vote',
        type: 'situation',
        content: 'Workers vote 65% to accept the deal. Those who opposed feel heard even in defeat. The vote gives the agreement democratic legitimacy, strengthening your position to ensure compliance.',
        choices: [
          {
            id: 'j1',
            text: 'Implement the decision with unity',
            nextNodeId: 'outcome-democratic-success',
            consequence: 'You move forward with democratic mandate',
            score: 3,
            principles: ['Democracy', 'Unity']
          }
        ]
      },
      'coop-development': {
        id: 'coop-development',
        type: 'situation',
        content: 'After months of work, you present a viable cooperative plan. Workers vote to pursue it. The government, impressed by your seriousness, provides initial financing. The foreign investor withdraws, leaving the cooperative as the only option.',
        choices: [
          {
            id: 'k1',
            text: 'Launch the cooperative with worker support',
            nextNodeId: 'outcome-cooperative-launch',
            consequence: 'You create an alternative ownership model',
            score: 3,
            principles: ['Innovation', 'Worker Ownership']
          }
        ]
      },
      'leverage-coop': {
        id: 'leverage-coop',
        type: 'situation',
        content: 'Using the cooperative threat, you extract better terms from the foreign investor. Workers get more protections, though the cooperative idea is abandoned. Some feel you used and then discarded their hopes for ownership.',
        choices: [
          {
            id: 'l1',
            text: 'Acknowledge the tactical use honestly',
            nextNodeId: 'outcome-tactical-success',
            consequence: 'You are transparent about your strategy',
            score: 1,
            principles: ['Honesty', 'Strategy']
          }
        ]
      },
      'strike-outcome': {
        id: 'strike-outcome',
        type: 'outcome',
        content: 'The strike fails to change the situation.',
        outcome: {
          title: 'Pyrrhic Resistance',
          description: 'The strike gains public sympathy but does not change economic realities. The plant eventually closes, and workers receive minimal compensation. Your principled stand, while admirable to some, did not protect livelihoods.',
          lessonsLearned: [
            'Resistance without alternatives is often futile',
            'Economic realities cannot be ignored indefinitely',
            'Principles must be balanced with pragmatic outcomes'
          ],
          relatedLectures: ['004-001', '003-002']
        }
      },
      'outcome-weak-position': {
        id: 'outcome-weak-position',
        type: 'outcome',
        content: 'You cannot recover your credibility.',
        outcome: {
          title: 'Lost Trust',
          description: 'Your attempt to renegotiate fails because you have no leverage. Workers feel betrayed, and you lose your leadership position. The transition proceeds without meaningful worker voice.',
          lessonsLearned: [
            'Initial positions matter - they shape what\'s possible',
            'Trust once lost is hard to regain',
            'Representing workers means fighting for them, not just accepting outcomes'
          ],
          relatedLectures: ['002-003', '003-003']
        }
      },
      'outcome-sellout': {
        id: 'outcome-sellout',
        type: 'outcome',
        content: 'History judges you harshly.',
        outcome: {
          title: 'The Collaborator\'s Legacy',
          description: 'Your argument that cooperation served workers long-term is rejected by most. Without fighting for protections, workers suffer through a brutal transition. You are remembered as someone who surrendered without a fight.',
          lessonsLearned: [
            'Leadership requires advocating for those you represent',
            'Collaboration without negotiation is capitulation',
            'Long-term arguments cannot excuse short-term abandonment'
          ],
          relatedLectures: ['002-002', '004-002']
        }
      },
      'outcome-strategic-success': {
        id: 'outcome-strategic-success',
        type: 'outcome',
        content: 'Your strategy paid off.',
        outcome: {
          title: 'Strategic Victory',
          description: 'By buying time and using it wisely, you secured a better outcome than initially seemed possible. The winning bidder offers strong worker protections to beat competitors. Your patience and preparation made the difference.',
          lessonsLearned: [
            'Time can be a strategic asset',
            'Preparation improves negotiating position',
            'Competition among suitors benefits those being sought'
          ],
          relatedLectures: ['003-001', '004-001']
        }
      },
      'outcome-forced-negotiation': {
        id: 'outcome-forced-negotiation',
        type: 'outcome',
        content: 'You negotiated too late.',
        outcome: {
          title: 'Missed Window',
          description: 'Negotiating under threat of closure yields poor terms. Workers get minimal protections. Your long resistance, while principled, left you with no good options when reality forced a choice.',
          lessonsLearned: [
            'Timing matters in negotiation',
            'Refusing to engage can lead to worse outcomes',
            'Principles without pragmatism can harm those you represent'
          ],
          relatedLectures: ['003-003', '002-004']
        }
      },
      'outcome-managed-transition': {
        id: 'outcome-managed-transition',
        type: 'outcome',
        content: 'The transition succeeds.',
        outcome: {
          title: 'Managed Change',
          description: 'Your negotiated protections made a difficult transition bearable. Not everyone thrived, but no one was abandoned. You demonstrated that change can be managed humanely with proper advocacy.',
          lessonsLearned: [
            'Good agreements require ongoing attention',
            'Protection does not mean preventing change, but managing it',
            'Worker advocacy can coexist with economic transition'
          ],
          relatedLectures: ['003-002', '004-001']
        }
      },
      'outcome-worse-deal': {
        id: 'outcome-worse-deal',
        type: 'outcome',
        content: 'You salvage what you can.',
        outcome: {
          title: 'Costly Lesson',
          description: 'The worse deal proceeds. Workers suffer more than they would have under the original offer. You learn that perfect can be the enemy of good, and that overreach has consequences.',
          lessonsLearned: [
            'Know when to close a deal',
            'Overreach can produce worse outcomes than accepting imperfect terms',
            'Negotiation requires understanding the other side\'s limits'
          ],
          relatedLectures: ['003-004', '002-003']
        }
      },
      'outcome-continued-fight': {
        id: 'outcome-continued-fight',
        type: 'outcome',
        content: 'The fight continues.',
        outcome: {
          title: 'Unresolved Struggle',
          description: 'Your refusal to accept defeat prolongs the uncertainty. Some admire your persistence; others wish for resolution. The outcome remains unclear, and workers live in limbo.',
          lessonsLearned: [
            'Persistence is not always productive',
            'Workers need stability, not perpetual conflict',
            'Sometimes accepting a loss enables moving forward'
          ],
          relatedLectures: ['002-004', '004-002']
        }
      },
      'outcome-democratic-success': {
        id: 'outcome-democratic-success',
        type: 'outcome',
        content: 'Democratic process strengthens the outcome.',
        outcome: {
          title: 'Democratic Legitimacy',
          description: 'By letting workers vote, you ensured the decision had legitimacy. Implementation is smoother because everyone feels ownership of the outcome. Democratic unionism proves its value.',
          lessonsLearned: [
            'Democratic process builds legitimacy',
            'Even difficult decisions are easier to implement when made collectively',
            'Leadership means enabling choice, not just making decisions'
          ],
          relatedLectures: ['001-003', '002-002']
        }
      },
      'outcome-cooperative-launch': {
        id: 'outcome-cooperative-launch',
        type: 'outcome',
        content: 'The cooperative succeeds.',
        outcome: {
          title: 'Worker Ownership Realized',
          description: 'The cooperative faces challenges but survives. Workers share both risks and rewards. You have created a model that others study and sometimes replicate. Economic democracy is possible.',
          lessonsLearned: [
            'Alternative ownership models can work',
            'Worker ownership requires commitment and capability',
            'Economic democracy is difficult but achievable'
          ],
          relatedLectures: ['004-001', '004-002']
        }
      },
      'outcome-tactical-success': {
        id: 'outcome-tactical-success',
        type: 'outcome',
        content: 'Your honesty is respected.',
        outcome: {
          title: 'Tactical but Honest',
          description: 'Your acknowledgment that you used the cooperative tactically disappoints some but is respected by many. You secured better terms, and your honesty preserves trust for future negotiations.',
          lessonsLearned: [
            'Tactics can serve workers if used honestly',
            'Transparency about methods builds long-term trust',
            'Leverage is a legitimate tool in negotiation'
          ],
          relatedLectures: ['002-001', '003-001']
        }
      }
    }
  }
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

export function getScenarioNode(scenario: Scenario, nodeId: string): ScenarioNode | undefined {
  return scenario.nodes[nodeId];
}
