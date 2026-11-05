import type { AnswerState } from "./types";

export const STATE_LABELS: Record<AnswerState, string> = {
  supported: "Information found in the cited source.",
  possible_match: "This may be relevant. Check the full eligibility conditions with the responsible authority.",
  clarification_needed: "More detail is needed to point you to the right source.",
  conflicting_evidence: "Sources differ. Please confirm the current rule with the responsible authority.",
  not_verified: "I could not verify this from the official sources available to me.",
  retrieval_failure: "I couldn't retrieve the relevant source just now, so I can't confirm the current details.",
  sensitive_input: "Please do not share sensitive personal identifiers.",
  model_unavailable: "The answering service is unavailable right now.",
  rate_limited: "Too many requests. Please wait a moment and try again.",
  invalid_input: "The question could not be processed.",
  error: "Something went wrong. Please try again later.",
};

export const NOT_VERIFIED_TEXT =
  "I could not verify this from the official sources available to me. I don't want to guess about your rights or eligibility. Please check the responsible department's current guidance.";

export const RETRIEVAL_FAILURE_TEXT =
  "I couldn't retrieve the relevant source just now, so I can't confirm the current details. Please try again shortly or check the official source directly.";

export const MODEL_UNAVAILABLE_TEXT =
  "The answering service is unavailable right now. Please try again shortly or check the official sources directly.";

export const SENSITIVE_TEXT =
  "Your message appears to contain a sensitive personal identifier, such as an Aadhaar, PAN or card number. I have not processed or stored it. AccessMitra AI does not need such details to point you to official information. Please ask again without the number.";

export const UNVERIFIED_SOURCE_NOTE =
  "The source records behind this answer have not yet been checked by a human reviewer, and the summary may be out of date. Open the official source and check the current details before relying on it.";

export const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];
