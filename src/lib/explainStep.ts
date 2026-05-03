import { ExecutionStep } from '@/types';

export function generateExplanation(step: ExecutionStep, _code: string, _language: string): string {
  if (step.explanation) return step.explanation;

  const line = step.lineContent.trim();
  
  if (line.includes('if')) return "Evaluating the condition to decide the next path.";
  if (line.includes('for') || line.includes('while')) return "Executing a loop iteration based on the condition.";
  if (line.includes('return')) return "Returning the result and exiting the current scope.";
  if (line.includes('class')) return `Defining the blueprint for ${line.split(' ')[2]}.`;
  if (line.includes('def ') || line.includes('function ')) return "Defining a reusable block of logic.";
  
  return "Executing the current statement and updating the system state.";
}
