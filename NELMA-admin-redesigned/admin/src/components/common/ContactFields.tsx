import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ContactValues {
  fullName: string;
  email: string;
  phone: string;
}
export function ContactFields({
  value,
  onChange,
}: {
  value: ContactValues;
  onChange: (value: ContactValues) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(
        [
          ["fullName", "Full name", "text"],
          ["email", "Email address", "email"],
          ["phone", "Phone number", "tel"],
        ] as const
      ).map(([key, label, type]) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key}>{label}</Label>
          <Input
            id={key}
            type={type}
            required
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            minLength={key === "fullName" ? 3 : key === "phone" ? 9 : undefined}
            pattern={
              key === "fullName" ? ".*\\S.*" : key === "phone" ? "[+0-9 \\(\\)\\-]{9,}" : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
