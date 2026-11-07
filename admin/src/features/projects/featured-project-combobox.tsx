import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import type { AdminProject } from "./project-contract";
import { isFeaturedEligible } from "./featured-projects-model";

type FeaturedProjectComboboxProps = {
  readonly disabled: boolean;
  readonly errorId?: string;
  readonly onChange: (projectId: string | null) => void;
  readonly projects: readonly AdminProject[];
  readonly selectedIds: readonly (string | null)[];
  readonly value: string | null;
};

const categoryLabels = {
  "Personal Project": "Personal",
  "Work Project": "Work",
  "Capstone Project": "Capstone",
} as const;

export function FeaturedProjectCombobox({
  disabled,
  errorId,
  onChange,
  projects,
  selectedIds,
  value,
}: FeaturedProjectComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = projects.find((project) => project.id === value);

  function choose(projectId: string | null) {
    onChange(projectId);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-describedby={errorId}
          aria-expanded={open}
          aria-invalid={errorId ? "true" : undefined}
          className="featured-combobox-trigger"
          disabled={disabled}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span>
            {selected === undefined ? "Select a Project" : selected.draft.name}
          </span>
          <ChevronsUpDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="featured-combobox-popover">
        <Command>
          <CommandInput placeholder="Search Projects…" />
          <CommandList>
            <CommandEmpty>No Project found.</CommandEmpty>
            <CommandGroup>
              {value !== null && (
                <CommandItem
                  onSelect={() => choose(null)}
                  value="clear selection"
                >
                  Clear selection
                </CommandItem>
              )}
              {projects.map((project) => {
                const selectedElsewhere =
                  project.id !== value && selectedIds.includes(project.id);
                const eligible = isFeaturedEligible(project);
                const unavailable = !eligible || selectedElsewhere;
                const context = selectedElsewhere
                  ? "Already selected"
                  : eligible
                    ? `${categoryLabels[project.draft.category]} · Eligible`
                    : project.lifecycle === "trashed"
                      ? "Trashed · Ineligible"
                      : "Excluded from publish · Ineligible";
                return (
                  <CommandItem
                    disabled={unavailable}
                    key={project.id}
                    onSelect={() => choose(project.id)}
                    value={`${project.draft.name} ${project.draft.slug}`}
                  >
                    <Check
                      aria-hidden="true"
                      className={
                        project.id === value ? "is-visible" : undefined
                      }
                    />
                    <span>
                      <strong>{project.draft.name}</strong>
                      <small>{context}</small>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
