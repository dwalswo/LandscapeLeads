"use client";

import { useState } from "react";
import { formatPhoneNumber } from "@/lib/phone";

export default function PhoneInput({
  id,
  name,
  required,
  defaultValue,
  className,
  placeholder = "(512) 555-0123",
}) {
  const [value, setValue] = useState(formatPhoneNumber(defaultValue));

  return (
    <input
      id={id}
      name={name}
      type="tel"
      inputMode="numeric"
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(formatPhoneNumber(e.target.value))}
      className={className}
    />
  );
}
