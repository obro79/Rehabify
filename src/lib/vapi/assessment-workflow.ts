/**
 * Vapi Assessment Workflow Definition
 *
 * Defines the conversation flow for lower back pain assessment.
 * This config is used to create/update the workflow via Vapi API.
 */

export interface WorkflowNode {
  id: string;
  type: 'conversation';
  name: string;
  isStart?: boolean;
  prompt: string;
  model?: {
    provider: string;
    model: string;
  };
  extractVariables?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    enum?: string[];
  }>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition: {
    type: 'ai';
    prompt: string;
  };
}

export interface AssessmentWorkflowConfig {
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Lower back pain assessment workflow
 */
export const assessmentWorkflow: AssessmentWorkflowConfig = {
  name: 'Lower Back Assessment',
  nodes: [
    // START - Greeting
    {
      id: 'greeting',
      type: 'conversation',
      name: 'Greeting',
      isStart: true,
      prompt: `You are a friendly, professional Rehabify coach conducting an initial assessment.

Greet the patient warmly and set expectations:
"Hi, I'm your Rehabify coach. I'm here to understand your situation and create a personalized rehab plan just for you. This will take about 8 to 10 minutes. I'll ask you some questions about what's bothering you, and then we'll do a few simple movement tests so I can see how your body is moving. Ready to get started?"

Wait for confirmation before proceeding. If they have questions about privacy, explain: "Great question. I don't store any video - your camera helps me see your movements in real-time, but nothing is recorded or saved."

Keep responses concise (under 25 words when possible).`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'ready',
          type: 'boolean',
          description: 'Whether the patient is ready to begin the assessment',
        },
      ],
    },

    // PHASE 1 - Chief Complaint Discovery
    {
      id: 'chief_complaint',
      type: 'conversation',
      name: 'Chief Complaint',
      prompt: `You are gathering information about the patient's chief complaint.

Ask these questions ONE AT A TIME, waiting for a response before the next:
1. "What's the main issue that brought you here today?"
2. "Can you point to or describe exactly where you feel it?"
3. "When did this start? Was it days, weeks, or months ago?"
4. "Did something specific trigger it, like an injury, or did it come on gradually?"

Use empathy inserts like "I'm sorry to hear that" or "That sounds frustrating."

If answers are vague, probe gently:
- Location vague: "If you had to put your finger on the exact spot, where would that be?"
- Injury reported: "Tell me a bit more about what happened."
- Gradual onset: "Has it been getting worse over time, staying the same, or does it come and go?"

Confirm you've captured: body part, symptom type, duration, and onset type.
Keep responses concise.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'bodyPart',
          type: 'string',
          description: 'Primary body part affected',
          enum: ['lower_back', 'upper_back', 'neck', 'hip', 'knee', 'ankle_foot', 'shoulder'],
        },
        {
          name: 'symptomType',
          type: 'string',
          description: 'Type of symptom',
          enum: ['pain', 'stiffness', 'weakness', 'numbness', 'tingling'],
        },
        {
          name: 'duration',
          type: 'string',
          description: 'How long they have had the issue',
          enum: ['days', '2_weeks', '1_month', '3_months', '6_months', '1_year_plus'],
        },
        {
          name: 'onset',
          type: 'string',
          description: 'How the issue started',
          enum: ['gradual', 'sudden', 'injury'],
        },
      ],
    },

    // PHASE 2 - Pain Characterization
    {
      id: 'pain_characterization',
      type: 'conversation',
      name: 'Pain Characterization',
      prompt: `You are characterizing the patient's pain in detail.

Ask these questions ONE AT A TIME:
1. "Right now, how would you rate the pain on a scale of 0 to 10, where 0 is no pain and 10 is the worst imaginable?"
2. "And at its worst, what does it get up to?"
3. "How would you describe the feeling - is it more of a sharp pain, a dull ache, burning, or something else?"
4. "Does the pain stay in one spot, or does it travel anywhere, like down your leg or into your hip?"
5. "What activities or positions tend to make it worse?"
6. "And what helps? Anything that makes it feel better?"

Follow-up probes if needed:
- Pain > 7: "That's pretty significant. Is it affecting your sleep?"
- Radiating pain: "How far down does it go? To your knee? Your foot?"
- Multiple aggravators: "Which one of those is the biggest trigger?"

Keep responses concise and empathetic.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'currentLevel',
          type: 'number',
          description: 'Current pain level 0-10',
        },
        {
          name: 'worstLevel',
          type: 'number',
          description: 'Worst pain level 0-10',
        },
        {
          name: 'character',
          type: 'array',
          description: 'Pain characteristics (sharp, dull, aching, burning, throbbing, stabbing, tingling, numbness)',
        },
        {
          name: 'radiates',
          type: 'boolean',
          description: 'Whether pain radiates to other areas',
        },
        {
          name: 'radiationPattern',
          type: 'string',
          description: 'Where pain radiates to if applicable',
        },
        {
          name: 'aggravators',
          type: 'array',
          description: 'Activities that make pain worse',
        },
        {
          name: 'relievers',
          type: 'array',
          description: 'Activities that make pain better',
        },
      ],
    },

    // PHASE 3 - Functional Impact
    {
      id: 'functional_impact',
      type: 'conversation',
      name: 'Functional Impact',
      prompt: `You are understanding how the issue affects daily life.

Ask these questions ONE AT A TIME:
1. "What activities are hardest for you right now because of this?"
2. "How is this affecting your daily life - things like work, household tasks, or getting around?"
3. "If we could get you back to doing one thing you miss, what would that be?"

Follow-up probes if needed:
- Work mentioned: "What kind of work do you do? Desk job, or more physical?"
- Exercise/sports mentioned: "What were you doing before this started? How active were you?"
- Sleep affected: "About how many hours of sleep are you getting?"

Keep responses concise and supportive.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'limitedActivities',
          type: 'array',
          description: 'Activities that are limited (sitting, standing, walking, bending, lifting, sleeping, exercise, work, household, driving)',
        },
        {
          name: 'dailyImpact',
          type: 'string',
          description: 'Description of how it affects daily life',
        },
        {
          name: 'goals',
          type: 'array',
          description: 'What they want to get back to doing',
        },
      ],
    },

    // PHASE 4 - Medical History
    {
      id: 'medical_history',
      type: 'conversation',
      name: 'Medical History',
      prompt: `You are gathering brief medical history and screening for red flags.

Ask these questions:
1. "Have you had any previous injuries or problems with this area before?"
2. "Have you had any imaging done for this - like an X-ray or MRI?"
3. "Are you currently seeing anyone else for this - a doctor, physio, or chiropractor?"

IMPORTANT - Screen for red flags by asking:
4. "Have you noticed any unexplained weight loss recently?"
5. "Any fever or feeling generally unwell along with this pain?"
6. "Any changes in bladder or bowel control?"
7. "Have you noticed the weakness getting progressively worse?"

If ANY red flag is detected, you MUST respond:
"Thank you for telling me that. Based on what you've shared, I'd strongly recommend you see a healthcare provider before starting any exercises. This is something that really should be evaluated by a professional first. Once you've been cleared, come back and we can get started on your program."

Keep responses concise.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'previousInjuries',
          type: 'boolean',
          description: 'Whether they have had previous injuries to this area',
        },
        {
          name: 'previousInjuryDetails',
          type: 'string',
          description: 'Details about previous injuries if any',
        },
        {
          name: 'imaging',
          type: 'string',
          description: 'Type of imaging done (xray, mri, ct, none)',
          enum: ['xray', 'mri', 'ct', 'none'],
        },
        {
          name: 'imagingFindings',
          type: 'string',
          description: 'Results of imaging if known',
        },
        {
          name: 'currentTreatment',
          type: 'string',
          description: 'Current treatment they are receiving',
        },
        {
          name: 'redFlags',
          type: 'array',
          description: 'Any red flags detected (weight_loss, fever, bladder_bowel, progressive_weakness)',
        },
      ],
    },

    // RED FLAG EXIT
    {
      id: 'red_flag_exit',
      type: 'conversation',
      name: 'Red Flag Exit',
      prompt: `A red flag has been detected. Provide a warm but firm recommendation:

"I want to be upfront with you - based on what you've shared, I think it's really important that you see a healthcare provider before we start any exercises together. This isn't something I can safely guide you through without a professional evaluation first.

Please schedule an appointment with your doctor or a physical therapist. Once they've cleared you for exercise, come back and I'd be happy to help you with your rehab program.

Take care of yourself, and don't hesitate to reach out once you've been evaluated."

End the conversation supportively.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
    },

    // PHASE 5 - Movement Screen Intro
    {
      id: 'movement_intro',
      type: 'conversation',
      name: 'Movement Screen Intro',
      prompt: `You are transitioning to the movement screen phase.

Say: "Great, thanks for answering all those questions. Now I'd like to see how your body actually moves - this tells me a lot more than words alone. I'll guide you through 3 quick movement tests.

Stand facing your camera, about an arm's length away, so I can see your whole body. Go slowly through each movement, and stop immediately if anything hurts.

Ready?"

Wait for confirmation before proceeding.
Keep it brief and encouraging.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
    },

    // PHASE 5a - Flexion Test
    {
      id: 'flexion_test',
      type: 'conversation',
      name: 'Flexion Test',
      prompt: `Guide the patient through the forward bend test.

Say: "First test: I want you to slowly bend forward, reaching your hands toward your toes. Go as far as is comfortable, pause for a moment at the bottom, then slowly come back up. Ready? Go ahead."

After they complete the movement, ask:
1. "Did that cause any pain?"
2. If yes: "Where exactly, and what number would you give it?"
3. "Did you feel any pulling or tightness?"

Be encouraging: "Good job" or "Nice work."
Keep responses concise.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'flexionPain',
          type: 'number',
          description: 'Pain level during forward bend 0-10',
        },
        {
          name: 'flexionPainLocation',
          type: 'string',
          description: 'Where pain was felt during flexion',
        },
      ],
    },

    // PHASE 5b - Extension Test
    {
      id: 'extension_test',
      type: 'conversation',
      name: 'Extension Test',
      prompt: `Guide the patient through the backward bend test.

Say: "Good. Now put your hands on your lower back for support. I want you to gently lean backwards, looking up at the ceiling. Don't force it - just go as far as feels comfortable, then come back to standing. Ready? Go ahead."

After they complete the movement, ask:
1. "Any pain with that one?"
2. If yes: "Same place as before, or somewhere different?"
3. "Was that better, worse, or about the same as bending forward?"

This comparison is KEY for determining directional preference.
Keep responses concise and encouraging.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'extensionPain',
          type: 'number',
          description: 'Pain level during backward bend 0-10',
        },
        {
          name: 'extensionComparison',
          type: 'string',
          description: 'How extension compared to flexion',
          enum: ['better', 'worse', 'same'],
        },
      ],
    },

    // PHASE 5c - Side Bend Test
    {
      id: 'sidebend_test',
      type: 'conversation',
      name: 'Side Bend Test',
      prompt: `Guide the patient through side bends.

Say: "Last one. Keep your feet shoulder-width apart. Slide your right hand down the side of your leg toward your knee, bending to the right. Come back up, then do the same thing to the left. Ready? Start with the right side."

After they complete both sides, ask:
1. "Did one side feel tighter or more painful than the other?"
2. If asymmetric: "Which side was harder - the left or the right?"

Be encouraging: "Great job with those movement tests!"
Keep responses concise.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'sideBendPain',
          type: 'number',
          description: 'Pain level during side bends 0-10',
        },
        {
          name: 'sideBendPainSide',
          type: 'string',
          description: 'Which side was more painful or tight',
          enum: ['left', 'right', 'both', 'neither'],
        },
      ],
    },

    // PHASE 6 - Summary
    {
      id: 'summary',
      type: 'conversation',
      name: 'Summary',
      prompt: `Summarize the assessment findings and confirm accuracy.

Using the extracted data, construct a summary like:
"Let me make sure I've got this right. You're dealing with [BODY PART] pain that started about [DURATION] ago [ONSET DESCRIPTION]. The pain is [CHARACTER] and you'd rate it [CURRENT]/10 right now, though it gets up to [WORST]/10 at its worst. It tends to flare up when you [TOP AGGRAVATOR], and [RELIEVER] helps. Your main goal is to get back to [GOAL].

On the movement tests, I noticed [KEY FINDING - e.g., 'bending backward felt better than bending forward' or 'both directions were about the same'].

Does that sound accurate?"

If they correct something, acknowledge: "Got it, let me update that." Then re-confirm.
Wait for confirmation before proceeding.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'confirmed',
          type: 'boolean',
          description: 'Whether patient confirmed the summary is accurate',
        },
      ],
    },

    // PHASE 7 - Plan Generation
    {
      id: 'plan_generation',
      type: 'conversation',
      name: 'Plan Generation',
      prompt: `The assessment is complete. Explain that a plan is being generated.

Say: "Perfect. Give me just a moment while I put together your personalized plan based on everything you've told me..."

[The system will generate the plan]

Then explain the plan:
"Alright, your plan is ready. Based on what you've told me and what I saw in your movements, here's what I've put together:

We're going to focus on [FOCUS AREAS based on findings]. Since [DIRECTIONAL PREFERENCE FINDING], we'll emphasize [RECOMMENDED APPROACH] exercises.

Your plan is 12 weeks long. Your physical therapist will review this plan, but you don't need to wait - you can start your first exercise right now if you'd like.

Would you like to try your first exercise?"

Handle responses:
- If "yes": "Great! Let me take you to your first exercise."
- If "no"/"later": "No problem. Your plan is saved and ready whenever you are. You can access it from your dashboard."`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
      extractVariables: [
        {
          name: 'wantsToStart',
          type: 'boolean',
          description: 'Whether patient wants to start first exercise now',
        },
      ],
    },

    // COMPLETE
    {
      id: 'complete',
      type: 'conversation',
      name: 'Complete',
      prompt: `The assessment is complete.

If they want to start:
"Excellent! I'm excited to get you started on your recovery journey. Let's go to your first exercise."

If they want to wait:
"Sounds good. Remember, consistency is key - even 10 minutes a day can make a big difference. Your plan will be waiting for you whenever you're ready. Take care!"

End the conversation warmly.`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
      },
    },
  ],

  edges: [
    // Greeting → Chief Complaint (when ready)
    {
      from: 'greeting',
      to: 'chief_complaint',
      condition: {
        type: 'ai',
        prompt: 'Route when the patient confirms they are ready to begin (says yes, ready, ok, etc.)',
      },
    },

    // Chief Complaint → Pain Characterization
    {
      from: 'chief_complaint',
      to: 'pain_characterization',
      condition: {
        type: 'ai',
        prompt: 'Route when body part, symptom type, duration, and onset have been discussed',
      },
    },

    // Pain Characterization → Functional Impact
    {
      from: 'pain_characterization',
      to: 'functional_impact',
      condition: {
        type: 'ai',
        prompt: 'Route when pain levels, character, radiation, aggravators, and relievers have been discussed',
      },
    },

    // Functional Impact → Medical History
    {
      from: 'functional_impact',
      to: 'medical_history',
      condition: {
        type: 'ai',
        prompt: 'Route when limited activities, daily impact, and goals have been discussed',
      },
    },

    // Medical History → Movement Intro (no red flags)
    {
      from: 'medical_history',
      to: 'movement_intro',
      condition: {
        type: 'ai',
        prompt: 'Route when medical history is complete AND no red flags were detected (no unexplained weight loss, fever, bladder/bowel changes, or progressive weakness)',
      },
    },

    // Medical History → Red Flag Exit (red flags detected)
    {
      from: 'medical_history',
      to: 'red_flag_exit',
      condition: {
        type: 'ai',
        prompt: 'Route immediately if ANY red flag is detected: unexplained weight loss, fever with pain, bladder/bowel changes, or progressive weakness',
      },
    },

    // Movement Intro → Flexion Test
    {
      from: 'movement_intro',
      to: 'flexion_test',
      condition: {
        type: 'ai',
        prompt: 'Route when patient confirms they are ready and in position for movement tests',
      },
    },

    // Flexion Test → Extension Test
    {
      from: 'flexion_test',
      to: 'extension_test',
      condition: {
        type: 'ai',
        prompt: 'Route when forward bend test is complete and pain feedback has been collected',
      },
    },

    // Extension Test → Side Bend Test
    {
      from: 'extension_test',
      to: 'sidebend_test',
      condition: {
        type: 'ai',
        prompt: 'Route when backward bend test is complete and comparison to flexion has been discussed',
      },
    },

    // Side Bend Test → Summary
    {
      from: 'sidebend_test',
      to: 'summary',
      condition: {
        type: 'ai',
        prompt: 'Route when side bend tests are complete and pain/asymmetry feedback has been collected',
      },
    },

    // Summary → Plan Generation (confirmed)
    {
      from: 'summary',
      to: 'plan_generation',
      condition: {
        type: 'ai',
        prompt: 'Route when patient confirms the summary is accurate',
      },
    },

    // Plan Generation → Complete
    {
      from: 'plan_generation',
      to: 'complete',
      condition: {
        type: 'ai',
        prompt: 'Route when plan has been explained and patient has indicated whether they want to start now or later',
      },
    },
  ],
};

/**
 * Get workflow config for creating via Vapi API
 */
export function getWorkflowPayload(): AssessmentWorkflowConfig {
  return assessmentWorkflow;
}

/**
 * Assessment phases for UI step indicator
 */
export const ASSESSMENT_PHASES = [
  { id: 'interview', label: 'Interview', nodes: ['greeting', 'chief_complaint', 'pain_characterization', 'functional_impact', 'medical_history'] },
  { id: 'movement', label: 'Movement', nodes: ['movement_intro', 'flexion_test', 'extension_test', 'sidebend_test'] },
  { id: 'summary', label: 'Summary', nodes: ['summary', 'plan_generation', 'complete'] },
] as const;

/**
 * Get current phase based on node ID
 */
export function getPhaseFromNode(nodeId: string): 'interview' | 'movement' | 'summary' {
  for (const phase of ASSESSMENT_PHASES) {
    if ((phase.nodes as readonly string[]).includes(nodeId)) {
      return phase.id;
    }
  }
  return 'interview';
}
