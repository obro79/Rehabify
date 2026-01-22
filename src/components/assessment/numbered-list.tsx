"use client";

interface NumberedListProps {
  items: string[];
}

export function NumberedList({ items }: NumberedListProps): React.ReactElement {
  return (
    <ul className="space-y-2 ml-1">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}
