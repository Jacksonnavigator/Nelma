import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { colors } from "../../constants/colors";
import { Input } from "./Input";
import type { TextInputProps } from "react-native";

type PasswordInputProps = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  error?: string;
};

export const PasswordInput = ({ label, error, ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <Input
      label={label}
      error={error}
      secureTextEntry={!visible}
      right={
        <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"} hitSlop={8} onPress={() => setVisible((current) => !current)}>
          <Icon color={colors.mutedText} size={21} strokeWidth={2.2} />
        </Pressable>
      }
      {...props}
    />
  );
};