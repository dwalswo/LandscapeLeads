"use client";

import { buyLead } from "./actions";

export default function BuyLeadForm({ sourceType, sourceId, children }) {
  return (
    <form
      action={buyLead}
      onSubmit={() => {
        sessionStorage.setItem("landscaperScrollY", String(window.scrollY));
      }}
    >
      <input type="hidden" name="source_type" value={sourceType} />
      <input type="hidden" name="source_id" value={sourceId} />
      <button
        type="submit"
        className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
      >
        {children}
      </button>
    </form>
  );
}
