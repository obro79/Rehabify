"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const CARDS = [
  { variant: undefined, title: "Default Card", desc: "A simple content container", content: "Card content goes here.", hasFooter: true },
  { variant: "elevated" as const, title: "Elevated Card", desc: "More prominent shadow", content: "For important content." },
  { variant: "outlined" as const, title: "Outlined Card", desc: "Border style variant", content: "Subtle container." },
];

export function CardSection(): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-4">
      {CARDS.map(card => (
        <Card key={card.title} variant={card.variant} className="w-64">
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.desc}</CardDescription>
          </CardHeader>
          <CardContent><p className="text-sm">{card.content}</p></CardContent>
          {card.hasFooter && <CardFooter><Button variant="ghost" size="sm">Action</Button></CardFooter>}
        </Card>
      ))}
    </div>
  );
}
