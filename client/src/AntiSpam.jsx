import React from "react";
import "altcha";

// ALTCHA inserts its solved proof as a hidden input named "altcha".
// The caller reads that field at submit time; the API verifies it cryptographically.
export function SpamFields({ purpose = "contact" }) {
  return (
    <>
      <div className="spam-trap" aria-hidden="true">
        <label>
          Company website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="altcha-verification">
        <altcha-widget
          challenge={`/api/security/altcha?purpose=${purpose}`}
          auto="onload"
          name="altcha"
          theme="dark"
          language="en"
        ></altcha-widget>
      </div>
    </>
  );
}
export function getSpamFields(formElement) {
  const data = new FormData(formElement);
  return {
    companyWebsite: String(data.get("companyWebsite") || ""),
    altcha: String(data.get("altcha") || ""),
  };
}
export function resetAltcha(formElement) {
  formElement?.querySelector("altcha-widget")?.reset();
}
