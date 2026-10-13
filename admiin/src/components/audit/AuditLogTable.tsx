import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge } from "@/components/common/RoleBadge";
import { formatDateTime } from "@/lib/format";
import type { AuditEvent } from "@/types";

/** Read-only audit trail. Entries can never be edited or deleted here. */
export function AuditLogTable({ events }: { events: AuditEvent[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date &amp; time</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="whitespace-nowrap">{formatDateTime(event.at)}</TableCell>
              <TableCell className="whitespace-nowrap font-medium text-foreground">
                {event.actor}
              </TableCell>
              <TableCell>
                <RoleBadge role={event.role} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{event.action}</TableCell>
              <TableCell className="whitespace-nowrap">{event.entity}</TableCell>
              <TableCell className="min-w-64">{event.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
