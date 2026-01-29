"use client"

import { cn } from "@/lib/utils"

export default function SkillChip({
  skill,
  isSelected,
  onSelect,
}: {
  skill: string
  isSelected: boolean
  onSelect?: () => void
}) {
  return (
    <button
      key={`f-skill-${skill}`}
      onClick={onSelect}
      className={cn(
        "px-3 py-1 h-8 border border-transparent rounded-lg text-sm transition-colors",
        skill.length > 3 ? "capitalize" : "uppercase",
        isSelected
          ? "bg-ut-blue/20 dark:bg-ut-blue/30 text-black/90 dark:text-white/80 border-black/10 dark:border-ut-blue/30"
          : "bg-black/3 dark:bg-white/3 text-black/50 dark:text-white/40 border-black/5 dark:border-white/3 hover:bg-black/5 dark:hover:bg-ut-blue/10 dark:hover:text-white/50",
      )}
    >
      {skill.toLowerCase()}
    </button>
  )
}
