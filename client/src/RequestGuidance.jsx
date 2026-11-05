import React from "react";
import "./RequestGuidance.css";

const GUIDANCE = {
  contact: {
    example:
      "I need a five-page website for my small business, including a contact form.",
    tips: "Tell us what you need, what it is for, and any timing or budget preferences.",
    max: 4000,
  },
  quote: {
    example:
      "Please print two 150 mm dragon figures in black PETG with a smooth finish.",
    tips: "Include the item’s purpose, measurements, finish, quantity, and any deadline.",
    max: 3000,
  },
};

/** Client-side guidance only; the Express API remains the source of truth for validation. */
export default function RequestGuidance({ value = "", type = "contact" }) {
  const config = GUIDANCE[type] || GUIDANCE.contact;
  const text = String(value).trim();
  const longEnough = text.length >= 15;
  const hasWords = /\p{L}{3,}/u.test(text);
  const valid = longEnough && hasWords && text.length <= config.max;
  const touched = text.length > 0;
  return (
    <div className="mtm-request-guidance" aria-live="polite">
      <p className="mtm-request-tip">{config.tips}</p>
      <p className="mtm-request-example">
        <strong>Example:</strong> “{config.example}”
      </p>
      <div className="mtm-request-indicators">
        <span className={touched && !longEnough ? "mtm-request-invalid" : ""}>
          {longEnough ? "✓" : "○"} At least 15 characters
        </span>
        <span className={touched && !hasWords ? "mtm-request-invalid" : ""}>
          {hasWords ? "✓" : "○"} Include a few words (numbers are welcome)
        </span>
        <span className="mtm-request-count">
          {text.length} / {config.max}
        </span>
      </div>
      {touched && !valid && (
        <p className="mtm-request-warning">
          Please describe your request in a short sentence, not just a number.
        </p>
      )}
      {touched && valid && (
        <p className="mtm-request-valid">
          ✓ Your description has enough detail to submit.
        </p>
      )}
    </div>
  );
}
