import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import DocumentDuplicateIcon from "@heroicons/react/24/solid/DocumentDuplicateIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";

interface SongEditorSeparatorProps {
  name?: string;
  acronym?: string;
  onNameChange?: (name: string) => void;
  onAcronymChange?: (acronym: string) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function SongEditorSeparator({
  name = '',
  acronym = '',
  onNameChange,
  onAcronymChange,
  onDuplicate,
  onRemove,
  showRemove = true,
}: SongEditorSeparatorProps) {

  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isEditingAcronym, setIsEditingAcronym] = useState(false);
  const [localAcronym, setLocalAcronym] = useState(acronym);
  const acronymInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation("songs");

  // Keep local state in sync when props change (e.g. propagation from another part)
  const prevName = useRef(name);
  const prevAcronym = useRef(acronym);
  if (prevName.current !== name) {
    prevName.current = name;
    if (!isEditingName) setLocalName(name);
  }
  if (prevAcronym.current !== acronym) {
    prevAcronym.current = acronym;
    if (!isEditingAcronym) setLocalAcronym(acronym);
  }

  const handleNameClick = () => {
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    onNameChange?.(localName);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nameInputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setLocalName(name);
      setIsEditingName(false);
    }
  };

  const handleAcronymClick = () => {
    setIsEditingAcronym(true);
    setTimeout(() => {
      acronymInputRef.current?.focus();
      acronymInputRef.current?.select();
    }, 0);
  };

  const handleAcronymBlur = () => {
    setIsEditingAcronym(false);
    onAcronymChange?.(localAcronym);
  };

  const handleAcronymKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      acronymInputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setLocalAcronym(acronym);
      setIsEditingAcronym(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1 select-none mt-1" contentEditable={false}>
      {/* Part name - left */}
      <div className="flex-shrink-0">
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            placeholder={t('input.partName')}
            className="text-xs px-2 py-0.5 bg-transparent border border-input rounded text-muted-foreground outline-none focus:border-ring w-28"
          />
        ) : (
          <button
            type="button"
            onClick={handleNameClick}
            className={cn(
              "text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer",
              localName
                ? "border-transparent text-muted-foreground hover:bg-accent"
                : "border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent",
            )}
          >
            {localName || t('input.partName')}
          </button>
        )}
      </div>

      {/* Acronym badge - only shown when there's a name */}
      {(localName || isEditingAcronym) && (
        <div className="flex-shrink-0">
          {isEditingAcronym ? (
            <input
              ref={acronymInputRef}
              type="text"
              value={localAcronym}
              onChange={(e) => setLocalAcronym(e.target.value.slice(0, 4))}
              onBlur={handleAcronymBlur}
              onKeyDown={handleAcronymKeyDown}
              maxLength={4}
              className="text-xs px-1.5 py-0.5 bg-transparent border border-input rounded text-muted-foreground outline-none focus:border-ring w-12"
            />
          ) : (
            <button
              type="button"
              onClick={handleAcronymClick}
              title={t('input.partAcronym')}
              className={cn(
                "text-xs px-1.5 py-0.5 rounded border transition-colors cursor-pointer min-w-[1.75rem]",
                localAcronym
                  ? "border-transparent text-muted-foreground hover:bg-accent"
                  : "border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent",
              )}
            >
              {localAcronym || '—'}
            </button>
          )}
        </div>
      )}

      {/* Line - center */}
      <div className="flex-1 border-t border-border" />

      {/* Action buttons - right */}
      <div className="flex items-center gap-0.5 px-2">
        <button
          type="button"
          onClick={onDuplicate}
          title={t('edit.duplicatePart')}
          className="p-1 rounded transition-colors cursor-pointer text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent"
        >
          <DocumentDuplicateIcon className="size-3.5" />
        </button>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            title={t('edit.deletePart')}
            className="p-1 rounded transition-colors cursor-pointer text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
