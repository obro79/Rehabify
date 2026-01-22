import { createEdge, type WorkflowEdge } from './workflow-types';

export const workflowEdges: WorkflowEdge[] = [
  createEdge('greeting', 'chief_complaint', 'Route when the patient confirms they are ready to begin (says yes, ready, ok, etc.)'),
  createEdge('chief_complaint', 'pain_characterization', 'Route when body part, symptom type, duration, and onset have been discussed'),
  createEdge('pain_characterization', 'functional_impact', 'Route when pain levels, character, radiation, aggravators, and relievers have been discussed'),
  createEdge('functional_impact', 'medical_history', 'Route when limited activities, daily impact, and goals have been discussed'),
  createEdge('medical_history', 'movement_intro', 'Route when medical history is complete AND no red flags were detected (no unexplained weight loss, fever, bladder/bowel changes, or progressive weakness)'),
  createEdge('medical_history', 'red_flag_exit', 'Route immediately if ANY red flag is detected: unexplained weight loss, fever with pain, bladder/bowel changes, or progressive weakness'),
  createEdge('movement_intro', 'flexion_test', 'Route when patient confirms they are ready and in position for movement tests'),
  createEdge('flexion_test', 'extension_test', 'Route when forward bend test is complete and pain feedback has been collected'),
  createEdge('extension_test', 'sidebend_test', 'Route when backward bend test is complete and comparison to flexion has been discussed'),
  createEdge('sidebend_test', 'summary', 'Route when side bend tests are complete and pain/asymmetry feedback has been collected'),
  createEdge('summary', 'plan_generation', 'Route when patient confirms the summary is accurate'),
  createEdge('plan_generation', 'complete', 'Route when plan has been explained and patient has indicated whether they want to start now or later'),
];
