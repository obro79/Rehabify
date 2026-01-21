"use client";

import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/collapsible";

const EXERCISES = [
  { id: "1", title: "Cat-Camel Stretch", desc: "A gentle spinal mobility exercise. Start on hands and knees, alternate between arching and rounding your back." },
  { id: "2", title: "Cobra Stretch", desc: "Lie face down, place hands under shoulders, and gently push up to extend your spine while keeping hips on the ground." },
  { id: "3", title: "Dead Bug", desc: "Lie on your back with arms extended up and knees bent at 90. Lower opposite arm and leg while maintaining core stability." },
];

export function AccordionSection(): React.JSX.Element {
  return (
    <Accordion type="single" defaultValue="exercise-1">
      {EXERCISES.map(ex => (
        <AccordionItem key={ex.id} value={`exercise-${ex.id}`}>
          <AccordionTrigger>{ex.title}</AccordionTrigger>
          <AccordionContent>{ex.desc}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
