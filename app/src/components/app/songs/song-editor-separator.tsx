import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import DocumentDuplicateIcon from "@heroicons/react/24/outline/DocumentDuplicateIcon";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";

interface SongEditorSeparatorProps {
  name?: string;
  onNameChange?: (name: string) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function SongEditorSeparator({
  name = '',
  onNameChange,
  onDuplicate,
  onRemove,
  showRemove = true,
}: SongEditorSeparatorProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("songs");

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onNameChange?.(localName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setLocalName(name);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1 select-none mt-1" contentEditable={false}>
      {/* Part name - left */}
      <div className="flex-shrink-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={t('input.partName')}
            className="text-xs px-2 py-0.5 bg-transparent border border-input rounded text-muted-foreground outline-none focus:border-ring w-28"
          />
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              "text-xs px-2 py-0.5 rounded transition-colors cursor-pointer",
              localName
                ? "text-muted-foreground hover:bg-accent"
                : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent",
            )}
          >
            {localName || t('input.partName')}
          </button>
        )}
      </div>

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
