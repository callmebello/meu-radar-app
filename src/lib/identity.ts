/**
 * Who the person is, on this device.
 *
 * CPF and e-mail used to live only in sessionStorage, which dies with the tab —
 * so a returning user looked brand new and got the pre-scan quiz all over
 * again. They are mirrored to localStorage here so the app recognises someone
 * who already went through the funnel.
 *
 * This is device-local only. It does not change what reaches our servers: the
 * CPF is still sent to be hashed (see saveUser) and never stored raw there.
 */
const CPF_KEY = "priva_cpf";
const EMAIL_KEY = "priva_email";
const QUIZ_DONE_KEY = "priva_quiz_done";

function read(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

/** Kept in both: sessionStorage for existing callers, localStorage to persist. */
function write(key: string, value: string) {
  if (typeof window === "undefined" || !value) return;
  try {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export const getCpf = () => read(CPF_KEY);
export const getEmail = () => read(EMAIL_KEY);

export function rememberIdentity(cpf: string, email?: string) {
  write(CPF_KEY, cpf);
  if (email) write(EMAIL_KEY, email);
}

/** True once the pre-scan quiz has been completed on this device. */
export function hasCompletedQuiz(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(QUIZ_DONE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markQuizCompleted() {
  try {
    localStorage.setItem(QUIZ_DONE_KEY, "true");
  } catch {
    /* ignore */
  }
}
