import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AddCourse } from '@/components/AddCourse'

/**
 * The one add-a-course surface, hosted by the sidebar, Profile, and the mobile
 * account sheet. Stays open after a successful add: adding two or three courses
 * in one sitting is the common case, and the row flipping to "Added" plus the
 * sidebar updating behind the dialog is the confirmation.
 */
export function AddCourseDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-4rem)] flex-col">
        <DialogHeader>
          <DialogTitle>Add a course</DialogTitle>
          <DialogDescription>
            Search the Texas State catalog. Courses you already have are marked Added.
          </DialogDescription>
        </DialogHeader>
        <AddCourse />
      </DialogContent>
    </Dialog>
  )
}
