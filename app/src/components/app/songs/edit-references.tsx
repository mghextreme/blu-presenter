import { Fragment, ReactNode } from 'react';
import { useFieldArray, UseFieldArrayRemove, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EditSongReferencesItem } from './edit-references-item';

interface EditSongReferencesProps {
  // Generic on purpose: any form with a `references` array field works
  // (song editor, schedule editor).
  form: UseFormReturn<any>;
  /** Rendered instead of the editable inputs for auto-generated references
   * (e.g. a schedule's Spotify playlist, which the app manages server-side). */
  renderAutoReference?: (ix: number, remove: UseFieldArrayRemove) => ReactNode;
}

export function EditSongReferences({
  form,
  renderAutoReference,
}: Readonly<EditSongReferencesProps>) {
  const { t } = useTranslation('songs');

  const {
    fields: references,
    append,
    remove,
  } = useFieldArray({
    name: 'references',
    control: form.control,
    keyName: 'key',
  });

  const handleAppend = () => {
    append({ url: '', name: '' });
  };

  return (
    <div className="flex flex-col items-stretch space-y-2">
      <ul className="flex flex-col items-stretch space-y-2">
        {references.map((field, ix: number) =>
          // Auto-generated references (they carry a `source`) get their own
          // row without editable inputs, when the editor provides one.
          !!renderAutoReference && !!(field as { source?: string }).source ? (
            <Fragment key={`reference-${ix}`}>{renderAutoReference(ix, remove)}</Fragment>
          ) : (
            <EditSongReferencesItem form={form} ix={ix} remove={remove} key={`reference-${ix}`} />
          ),
        )}
      </ul>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAppend}
        className="me-auto"
      >
        {t('edit.addReference')}
      </Button>
    </div>
  );
}
