import { useCallback } from 'react'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useDeleteProperty, useRestoreProperty } from '@/hooks/useProperty'
import { useToast } from '@/hooks/useToast'
import type { PropertyRecord } from '@/shared'

export interface DeletePropertyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: PropertyRecord | null
  onDeleted?: (id: string) => void
}

const UNDO_DURATION_MS = 5000

export function DeletePropertyDialog({
  open,
  onOpenChange,
  property,
  onDeleted,
}: DeletePropertyDialogProps) {
  const toast = useToast()
  const deleteProperty = useDeleteProperty()
  const restoreProperty = useRestoreProperty()

  const handleUndo = useCallback(
    (id: string, name: string) => {
      restoreProperty.mutate(id, {
        onSuccess: () => {
          toast.success('Property restored', { description: `"${name}" has been restored.` })
        },
        onError: () => {
          toast.error('Could not undo', {
            description: 'The property could not be restored. Try again from the properties list.',
          })
        },
      })
    },
    [restoreProperty, toast],
  )

  const handleConfirm = async () => {
    if (!property) return

    const { id, name } = property

    try {
      // Optimistic: close dialog immediately
      onOpenChange(false)
      onDeleted?.(id)

      await deleteProperty.mutateAsync(id)

      toast.success('Property deleted', {
        description: `"${name}" has been removed.`,
        duration: UNDO_DURATION_MS + 500,
        action: {
          label: 'Undo',
          onClick: () => handleUndo(id, name),
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error('Failed to delete property', { description: message })
    }
  }

  const isPending = deleteProperty.isPending

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (isPending) return
        onOpenChange(next)
      }}
      title="Delete property?"
      description={
        property
          ? `This will permanently remove "${property.name}". You can undo this within a few seconds after deletion.`
          : undefined
      }
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={isPending}
            disabled={isPending}
            onClick={handleConfirm}
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-lg border border-danger/20 bg-danger-soft/50 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-sm text-text2">
          This action can be undone immediately after. Properties with active tenancies or leases
          cannot be permanently removed until those records are closed.
        </p>
      </div>
    </Modal>
  )
}
