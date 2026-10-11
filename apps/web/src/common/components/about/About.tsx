import { Info } from 'lucide-react';
import { JSX } from 'react';

import { Button } from '@/common/components/shadcn/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/common/components/shadcn/sheet';

/**
 *
 * @returns
 */
export const About = (): JSX.Element => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="About this project" title="About this project">
          <Info className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">About this project</span>
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>About Interview Forge</SheetTitle>
          <SheetDescription>An AI-powered portfolio project</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div>
            This portfolio project is a human-in-the-loop AI agent that transforms a job description into a structured,
            recruiter-reviewed interview plan — and then closes the loop by reconciling post-interview scorecards with
            free-text recruiter notes to produce a final candidate assessment. The agent handles the heavy lifting
            (question generation, competency mapping, scoring reconciliation) while the human recruiter retains approval
            authority at two explicit checkpoints: plan review before the interview, and assessment review after. This
            project demonstrates the commercially dominant agentic pattern — AI that accelerates and augments human
            decision-making without removing human accountability from high-stakes hiring decisions.
          </div>
          <div>
            Amazon Bedrock is used to power the AI capabilities of Interview Forge. Pinecone is used for vector database
            management. It serves as a practical example of how to bring together AI knowledge bases and RAG techniques
            with system prompts and structured outputs to overcome real-world challenges.
          </div>
          <div>
            The project is available on GitHub, where you can find the source code and documentation. It includes
            instructions for getting started, system documentation, and examples of how to use the tool.
          </div>
          <div>
            For more information, visit the{' '}
            <a
              href="https://github.com/mwarman/interview-forge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              GitHub repository
            </a>
            .
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
